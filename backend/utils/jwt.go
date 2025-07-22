package utils

import (
	"errors"
	"fmt"
	"nhcommunity/config"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// TokenType defines the type of token
type TokenType string

const (
	// AccessToken represents an access token
	AccessToken TokenType = "access"
	// RefreshToken represents a refresh token
	RefreshToken TokenType = "refresh"
)

// JWTClaims defines the claims in JWT tokens
type JWTClaims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Type   string `json:"token_type"`
	Role   string `json:"role,omitempty"`
	jwt.RegisteredClaims
}

// GenerateAccessToken 为用户生成访问令牌
func GenerateAccessToken(userID uint) (string, error) {
	return GenerateToken(userID, "", AccessToken, "")
}

// GenerateRefreshToken 为用户生成刷新令牌
func GenerateRefreshToken(userID uint) (string, error) {
	return GenerateToken(userID, "", RefreshToken, "")
}

// ValidateRefreshToken 验证刷新令牌并返回用户ID
func ValidateRefreshToken(tokenString string) (uint, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return 0, err
	}

	if claims.Type != string(RefreshToken) {
		return 0, errors.New("token is not a refresh token")
	}

	return claims.UserID, nil
}

// GenerateToken creates a new JWT token for a user
func GenerateToken(userID uint, email string, tokenType TokenType, role string) (string, error) {
	// Create token expiry time
	var expiry time.Time

	if tokenType == AccessToken {
		expiry = time.Now().Add(time.Duration(config.AppConfig.TokenExpiresIn) * time.Minute)
	} else {
		// Refresh tokens last longer
		expiry = time.Now().Add(time.Duration(config.AppConfig.TokenExpiresIn*2) * time.Minute)
	}

	// Create the claims
	claims := &JWTClaims{
		UserID: userID,
		Email:  email,
		Type:   string(tokenType),
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiry),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "nhcommunity",
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Generate encoded token using the secret signing key
	tokenString, err := token.SignedString([]byte(config.AppConfig.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateToken validates the JWT token and returns claims
func ValidateToken(tokenString string) (*JWTClaims, error) {
	// Parse the token
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Return the secret key
		return []byte(config.AppConfig.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	// Extract claims
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// GenerateTokenPair generates both access and refresh tokens
func GenerateTokenPair(userID uint, email string) (accessToken string, refreshToken string, err error) {
	// Generate access token
	accessToken, err = GenerateToken(userID, email, AccessToken, "")
	if err != nil {
		return "", "", err
	}

	// Generate refresh token
	refreshToken, err = GenerateToken(userID, email, RefreshToken, "")
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}
