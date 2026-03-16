package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"live-show-api/pkg/jwt"
)

const (
	// ContextKeyUserID 用戶 ID 上下文鍵
	ContextKeyUserID = "user_id"
	// ContextKeyUsername 用戶名上下文鍵
	ContextKeyUsername = "username"
	// ContextKeyRoles 角色上下文鍵
	ContextKeyRoles = "roles"
	// ContextKeyTokenID Token ID 上下文鍵
	ContextKeyTokenID = "token_id"
)

// JWTAuthMiddleware JWT 認證中間件
type JWTAuthMiddleware struct {
	jwtManager        *jwt.Manager
	logger            *zap.Logger
	autoRefreshWindow time.Duration
}

// NewJWTAuthMiddleware 創建新的 JWT 認證中間件
func NewJWTAuthMiddleware(jwtManager *jwt.Manager, logger *zap.Logger, autoRefreshWindow time.Duration) *JWTAuthMiddleware {
	return &JWTAuthMiddleware{
		jwtManager:        jwtManager,
		logger:            logger,
		autoRefreshWindow: autoRefreshWindow,
	}
}

// AuthRequired 需要認證的路由中間件
func (m *JWTAuthMiddleware) AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 從 Header 中提取 token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "missing authorization header",
				"code":  "UNAUTHORIZED",
			})
			c.Abort()
			return
		}

		// 解析 Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid authorization header format",
				"code":  "UNAUTHORIZED",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// 驗證 token
		claims, err := m.jwtManager.ValidateAccessToken(tokenString)
		if err != nil {
			if err == jwt.ErrExpiredToken {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "token has expired",
					"code":  "TOKEN_EXPIRED",
				})
			} else {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "invalid token",
					"code":  "UNAUTHORIZED",
				})
			}
			c.Abort()
			return
		}

		// 檢查是否需要自動刷新
		timeUntilExpiry := time.Until(claims.ExpiresAt.Time)
		shouldRefresh := timeUntilExpiry < m.autoRefreshWindow

		// 將用戶信息存入上下文
		c.Set(ContextKeyUserID, claims.UserID)
		c.Set(ContextKeyUsername, claims.Username)
		c.Set(ContextKeyRoles, claims.Roles)
		c.Set(ContextKeyTokenID, claims.TokenID)
		c.Set("should_refresh", shouldRefresh)
		c.Set("token_expires_at", claims.ExpiresAt.Time)

		m.logger.Debug("token validated",
			zap.String("user_id", claims.UserID),
			zap.String("username", claims.Username),
			zap.Duration("time_until_expiry", timeUntilExpiry),
			zap.Bool("should_refresh", shouldRefresh),
		)

		c.Next()
	}
}

// OptionalAuth 可選認證中間件（不強制要求 token）
func (m *JWTAuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.Next()
			return
		}

		tokenString := parts[1]
		claims, err := m.jwtManager.ValidateAccessToken(tokenString)
		if err != nil {
			c.Next()
			return
		}

		timeUntilExpiry := time.Until(claims.ExpiresAt.Time)
		shouldRefresh := timeUntilExpiry < m.autoRefreshWindow

		c.Set(ContextKeyUserID, claims.UserID)
		c.Set(ContextKeyUsername, claims.Username)
		c.Set(ContextKeyRoles, claims.Roles)
		c.Set(ContextKeyTokenID, claims.TokenID)
		c.Set("should_refresh", shouldRefresh)
		c.Set("token_expires_at", claims.ExpiresAt.Time)

		c.Next()
	}
}

// GetUserID 從上下文中獲取用戶 ID
func GetUserID(c *gin.Context) string {
	userID, exists := c.Get(ContextKeyUserID)
	if !exists {
		return ""
	}
	return userID.(string)
}

// GetUsername 從上下文中獲取用戶名
func GetUsername(c *gin.Context) string {
	username, exists := c.Get(ContextKeyUsername)
	if !exists {
		return ""
	}
	return username.(string)
}

// GetRoles 從上下文中獲取角色
func GetRoles(c *gin.Context) []string {
	roles, exists := c.Get(ContextKeyRoles)
	if !exists {
		return nil
	}
	return roles.([]string)
}

// ShouldRefresh 檢查是否需要刷新 token
func ShouldRefresh(c *gin.Context) bool {
	shouldRefresh, exists := c.Get("should_refresh")
	if !exists {
		return false
	}
	return shouldRefresh.(bool)
}

// RoleRequired 角色權限檢查中間件
func RoleRequired(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRoles := GetRoles(c)
		if userRoles == nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "access denied",
				"code":  "FORBIDDEN",
			})
			c.Abort()
			return
		}

		// 檢查用戶是否有所需角色
		for _, requiredRole := range roles {
			for _, userRole := range userRoles {
				if userRole == requiredRole {
					c.Next()
					return
				}
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error": "insufficient permissions",
			"code":  "FORBIDDEN",
		})
		c.Abort()
	}
}
