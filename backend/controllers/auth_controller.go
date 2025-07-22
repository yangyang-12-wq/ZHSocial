package controllers

import (
	"log"
	"net/http"
	"nhcommunity/models"
	"nhcommunity/services"
	"nhcommunity/utils"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AuthController handles authentication endpoints
type AuthController struct {
	service services.UserService
	db      *gorm.DB // Keep DB for now for token management
}

// NewAuthController creates a new auth controller
func NewAuthController(service services.UserService, db *gorm.DB) *AuthController {
	return &AuthController{service: service, db: db}
}

// Register handles user registration
func (ac *AuthController) Register(c *gin.Context) {
	log.Println("INFO: Register request received")
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("ERROR: Failed to bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}
	log.Printf("INFO: Request body bound successfully: %+v", req)

	// 创建用户对象
	user := &models.User{
		Username:  req.Username,
		Email:     strings.ToLower(req.Email),
		Password:  req.Password,
		FullName:  req.FullName,
		StudentId: req.StudentId,
		Role:      "user",
		IsActive:  true,
	}

	createdUser, err := ac.service.Register(user)
	if err != nil {
		log.Printf("ERROR: User service failed to register: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to register user: " + err.Error()})
		return
	}
	log.Printf("INFO: User registered successfully in service: %+v", createdUser)

	// Generate tokens
	accessToken, err := utils.GenerateToken(createdUser.ID, createdUser.Email, utils.AccessToken, createdUser.Role)
	if err != nil {
		log.Printf("ERROR: Failed to generate access token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	refreshToken, err := utils.GenerateToken(createdUser.ID, createdUser.Email, utils.RefreshToken, createdUser.Role)
	if err != nil {
		log.Printf("ERROR: Failed to generate refresh token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}
	log.Println("INFO: Tokens generated successfully with role:", createdUser.Role)

	// Save refresh token to user
	if err := ac.db.Model(&createdUser).Update("refresh_token", refreshToken).Error; err != nil {
		log.Printf("ERROR: Failed to save refresh token: %v", err)
		// This is not a fatal error for registration, but should be logged.
		// We can decide if we want to return an error to the user here.
	} else {
		log.Println("INFO: Refresh token saved successfully")
	}

	// Return response
	log.Println("INFO: Sending successful response")
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "User registered successfully",
		"data": gin.H{
			"user":          createdUser.ToResponse(),
			"access_token":  accessToken,
			"refresh_token": refreshToken,
		},
	})
	log.Println("INFO: Response sent")
}

// Login handles user login
func (ac *AuthController) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 确定登录标识符（邮箱或用户名）
	identifier := req.Username
	if strings.Contains(identifier, "@") {
		// 如果是邮箱，直接使用
		identifier = strings.ToLower(identifier)
	} else {
		// 如果是用户名，先查找用户以获取邮箱
		user, err := ac.service.GetUserByUsername(identifier)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
			return
		}
		identifier = user.Email
	}

	// 使用邮箱和密码登录
	user, accessToken, refreshToken, err := ac.service.Login(identifier, req.Password)
	if err != nil {
		log.Printf("ERROR: Failed to login user: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// 检查是否需要生成包含角色的新令牌
	if user.Role != "" {
		// 生成包含角色信息的令牌
		accessToken, err = utils.GenerateToken(user.ID, user.Email, utils.AccessToken, user.Role)
		if err != nil {
			log.Printf("ERROR: Failed to generate token with role: %v", err)
		}

		// 更新刷新令牌
		refreshToken, err = utils.GenerateToken(user.ID, user.Email, utils.RefreshToken, user.Role)
		if err == nil {
			// 保存新的刷新令牌到数据库
			user.RefreshToken = refreshToken
			_, err = ac.service.UpdateCurrentUser(user.ID, &models.UpdateUserRequest{})
			if err != nil {
				log.Printf("ERROR: Failed to update refresh token: %v", err)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Login successful",
		"data": gin.H{
			"user":          user.ToResponse(),
			"access_token":  accessToken,
			"refresh_token": refreshToken,
		},
	})
}

// RefreshToken refreshes an access token using a refresh token
func (ac *AuthController) RefreshToken(c *gin.Context) {
	// Extract refresh token from Authorization header or query parameter
	refreshToken := c.GetHeader("Refresh-Token")
	if refreshToken == "" {
		refreshToken = c.Query("refresh_token")
	}

	if refreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Refresh token is required"})
		return
	}

	// 使用刷新令牌获取新的访问令牌
	accessToken, err := ac.service.RefreshToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	// Return the new access token
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Token refreshed successfully",
		"data": gin.H{
			"access_token": accessToken,
		},
	})
}

// Logout invalidates the user's refresh token
func (ac *AuthController) Logout(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Clear refresh token
	ac.db.Model(&models.User{}).Where("id = ?", userID).Update("refresh_token", "")

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
