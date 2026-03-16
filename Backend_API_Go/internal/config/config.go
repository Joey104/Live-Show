package config

import (
	"fmt"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

// Config 應用配置
type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	JWT      JWTConfig      `yaml:"jwt"`
	Log      LogConfig      `yaml:"log"`
}

// ServerConfig 服務器配置
type ServerConfig struct {
	Host         string        `yaml:"host"`
	Port         int           `yaml:"port"`
	ReadTimeout  time.Duration `yaml:"read_timeout"`
	WriteTimeout time.Duration `yaml:"write_timeout"`
}

// DatabaseConfig 數據庫配置
type DatabaseConfig struct {
	Driver   string `yaml:"driver"`
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	Database string `yaml:"database"`
	SSLMode  string `yaml:"ssl_mode"`
}

// JWTConfig JWT 配置
type JWTConfig struct {
	AccessSecret      string        `yaml:"access_secret"`
	RefreshSecret     string        `yaml:"refresh_secret"`
	AccessDuration    time.Duration `yaml:"access_duration"`
	RefreshDuration   time.Duration `yaml:"refresh_duration"`
	AutoRefreshWindow time.Duration `yaml:"auto_refresh_window"` // 自動刷新窗口期
}

// LogConfig 日誌配置
type LogConfig struct {
	Level string `yaml:"level"`
	File  string `yaml:"file"`
}

// Load 從文件加載配置
func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	// 設置默認值
	cfg.setDefaults()

	return &cfg, nil
}

// setDefaults 設置默認值
func (c *Config) setDefaults() {
	if c.Server.Host == "" {
		c.Server.Host = "0.0.0.0"
	}
	if c.Server.Port == 0 {
		c.Server.Port = 9114
	}
	if c.Server.ReadTimeout == 0 {
		c.Server.ReadTimeout = 30 * time.Second
	}
	if c.Server.WriteTimeout == 0 {
		c.Server.WriteTimeout = 30 * time.Second
	}

	if c.JWT.AccessDuration == 0 {
		c.JWT.AccessDuration = 15 * time.Minute // Access token 15 分鐘過期
	}
	if c.JWT.RefreshDuration == 0 {
		c.JWT.RefreshDuration = 7 * 24 * time.Hour // Refresh token 7 天過期
	}
	if c.JWT.AutoRefreshWindow == 0 {
		c.JWT.AutoRefreshWindow = 5 * time.Minute // 過期前 5 分鐘自動刷新
	}

	if c.Log.Level == "" {
		c.Log.Level = "info"
	}
}

// GetDSN 獲取數據庫連接字符串
func (d *DatabaseConfig) GetDSN() string {
	switch d.Driver {
	case "mysql":
		return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
			d.User, d.Password, d.Host, d.Port, d.Database)
	case "postgres":
		return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			d.Host, d.Port, d.User, d.Password, d.Database, d.SSLMode)
	case "sqlite":
		return d.Database
	default:
		return ""
	}
}

// DefaultConfig 返回默認配置
func DefaultConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Host:         "0.0.0.0",
			Port:         9114,
			ReadTimeout:  30 * time.Second,
			WriteTimeout: 30 * time.Second,
		},
		JWT: JWTConfig{
			AccessSecret:      "your-access-secret-key-change-in-production",
			RefreshSecret:     "your-refresh-secret-key-change-in-production",
			AccessDuration:    15 * time.Minute,
			RefreshDuration:   7 * 24 * time.Hour,
			AutoRefreshWindow: 5 * time.Minute,
		},
		Database: DatabaseConfig{
			Driver:   "sqlite",
			Database: "live_show.db",
		},
		Log: LogConfig{
			Level: "info",
		},
	}
}
