package jwt

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token has expired")
	ErrInvalidClaims = errors.New("invalid token claims")
)

// TokenPair 包含 access token 和 refresh token
type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	AccessExp    time.Time `json:"access_exp"`
	RefreshExp   time.Time `json:"refresh_exp"`
	TokenType    string    `json:"token_type"`
}

// TokenClaims JWT 聲明結構
type TokenClaims struct {
	UserID    string   `json:"user_id"`
	Username  string   `json:"username"`
	Email     string   `json:"email"`
	Roles     []string `json:"roles"`
	TokenID   string   `json:"jti"`
	TokenType string   `json:"type"` // "access" 或 "refresh"
	jwt.RegisteredClaims
}

// Manager JWT 管理器
type Manager struct {
	accessSecret    []byte
	refreshSecret   []byte
	accessDuration  time.Duration
	refreshDuration time.Duration
}

// Config JWT 配置
type Config struct {
	AccessSecret    string        `yaml:"access_secret"`
	RefreshSecret   string        `yaml:"refresh_secret"`
	AccessDuration  time.Duration `yaml:"access_duration"`
	RefreshDuration time.Duration `yaml:"refresh_duration"`
}

// NewManager 創建新的 JWT 管理器
func NewManager(cfg *Config) *Manager {
	return &Manager{
		accessSecret:    []byte(cfg.AccessSecret),
		refreshSecret:   []byte(cfg.RefreshSecret),
		accessDuration:  cfg.AccessDuration,
		refreshDuration: cfg.RefreshDuration,
	}
}

// GenerateTokenPair 生成一對新的 access token 和 refresh token
func (m *Manager) GenerateTokenPair(userID, username, email string, roles []string) (*TokenPair, error) {
	now := time.Now()
	
	// 生成 Access Token
	accessTokenID := uuid.New().String()
	accessExp := now.Add(m.accessDuration)
	accessClaims := TokenClaims{
		UserID:    userID,
		Username:  username,
		Email:     email,
		Roles:     roles,
		TokenID:   accessTokenID,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(accessExp),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ID:        accessTokenID,
			Subject:   userID,
		},
	}
	
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(m.accessSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}
	
	// 生成 Refresh Token
	refreshTokenID := uuid.New().String()
	refreshExp := now.Add(m.refreshDuration)
	refreshClaims := TokenClaims{
		UserID:    userID,
		TokenID:   refreshTokenID,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(refreshExp),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ID:        refreshTokenID,
			Subject:   userID,
		},
	}
	
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(m.refreshSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign refresh token: %w", err)
	}
	
	return &TokenPair{
		AccessToken:  accessTokenString,
		RefreshToken: refreshTokenString,
		AccessExp:    accessExp,
		RefreshExp:   refreshExp,
		TokenType:    "Bearer",
	}, nil
}

// ValidateAccessToken 驗證 access token
func (m *Manager) ValidateAccessToken(tokenString string) (*TokenClaims, error) {
	return m.validateToken(tokenString, m.accessSecret, "access")
}

// ValidateRefreshToken 驗證 refresh token
func (m *Manager) ValidateRefreshToken(tokenString string) (*TokenClaims, error) {
	return m.validateToken(tokenString, m.refreshSecret, "refresh")
}

// validateToken 驗證 token 的內部方法
func (m *Manager) validateToken(tokenString string, secret []byte, expectedType string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		// 確保簽名方法是 HS256
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secret, nil
	})
	
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}
	
	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidClaims
	}
	
	// 驗證 token 類型
	if claims.TokenType != expectedType {
		return nil, fmt.Errorf("%w: expected %s token, got %s", ErrInvalidToken, expectedType, claims.TokenType)
	}
	
	return claims, nil
}

// RefreshTokens 使用 refresh token 生成新的 token pair
func (m *Manager) RefreshTokens(refreshTokenString string) (*TokenPair, error) {
	// 驗證 refresh token
	claims, err := m.ValidateRefreshToken(refreshTokenString)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}
	
	// 生成新的 token pair
	// 注意：這裡我們只從 refresh token 中獲取 userID
	// 實際應用中應該從數據庫獲取最新的用戶信息
	return m.GenerateTokenPair(claims.UserID, claims.Username, claims.Email, claims.Roles)
}

// GetAccessTokenDuration 獲取 access token 有效期
func (m *Manager) GetAccessTokenDuration() time.Duration {
	return m.accessDuration
}

// GetRefreshTokenDuration 獲取 refresh token 有效期
func (m *Manager) GetRefreshTokenDuration() time.Duration {
	return m.refreshDuration
}
