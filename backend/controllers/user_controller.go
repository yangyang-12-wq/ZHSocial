package controllers

import (
	"log"
	"net/http"
	"nhcommunity/models"
	"nhcommunity/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

// UserController handles user-related endpoints
type UserController struct {
	service services.UserService
}

// NewUserController creates a new user controller
func NewUserController(service services.UserService) *UserController {
	return &UserController{service: service}
}

// GetCurrentUser gets the current authenticated user
func (uc *UserController) GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userResponse, err := uc.service.GetUserByID(userID.(uint), userID.(uint)) // Pass self ID for consistency
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": userResponse})
}

// UpdateCurrentUser updates the current authenticated user
func (uc *UserController) UpdateCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userResponse, err := uc.service.UpdateCurrentUser(userID.(uint), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": userResponse})
}

// GetUserByID gets a user by ID
func (uc *UserController) GetUserByID(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	currentUserID, _ := c.Get("user_id")
	uid, _ := currentUserID.(uint)

	userResponse, err := uc.service.GetUserByID(uint(userID), uid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": userResponse})
}

func (uc *UserController) Follow(c *gin.Context) {
	followerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	followingID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid user ID"})
		return
	}

	err = uc.service.Follow(followerID.(uint), uint(followingID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Successfully followed user"})
}

func (uc *UserController) Unfollow(c *gin.Context) {
	followerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	followingID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid user ID"})
		return
	}

	err = uc.service.Unfollow(followerID.(uint), uint(followingID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Successfully unfollowed user"})
}

// UpdateUserRole 管理员更新用户角色
func (uc *UserController) UpdateUserRole(c *gin.Context) {
	// 获取当前管理员信息
	adminId, _ := c.Get("user_id")

	// 获取目标用户ID
	userId, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	// 请求体
	var req struct {
		Role string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 验证角色值
	validRoles := map[string]bool{
		"user":      true,
		"moderator": true,
		"admin":     true,
	}

	if !validRoles[req.Role] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的角色值"})
		return
	}

	// 调用服务更新用户角色
	err = uc.service.UpdateUserRole(uint(userId), req.Role, adminId.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新用户角色失败: " + err.Error()})
		return
	}

	// 记录日志
	log.Printf("管理员 %v 将用户 %v 的角色更新为 %s", adminId, userId, req.Role)

	c.JSON(http.StatusOK, gin.H{
		"message": "用户角色已更新",
		"user_id": userId,
		"role":    req.Role,
	})
}

// GetAllUsers 获取所有用户
func (uc *UserController) GetAllUsers(c *gin.Context) {
	log.Println("UserController: 开始获取所有用户")

	// 直接从数据库查询
	db := uc.service.GetDB()
	var users []models.User

	// 使用Debug模式查询所有用户
	log.Println("UserController: 直接查询数据库")
	result := db.Debug().Find(&users)

	if result.Error != nil {
		log.Printf("UserController: 查询用户失败: %v", result.Error)
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "获取用户列表失败，返回空列表",
			"data":    []models.User{},
		})
		return
	}

	log.Printf("UserController: 数据库中找到 %d 个用户", len(users))

	// 确保返回的用户数组不为nil
	if users == nil {
		users = []models.User{}
	}

	// 打印每个用户的详细信息，帮助调试
	for i, user := range users {
		log.Printf("UserController: 用户[%d] = {ID: %d, Username: %s, Email: %s, Role: %s, IsActive: %t}",
			i, user.ID, user.Username, user.Email, user.Role, user.IsActive)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "获取用户列表成功",
		"data":    users,
	})
}

// sliceContains 检查字符串切片是否包含指定元素
func sliceContains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// UpdateUserStatus 更新用户状态（启用/禁用）
func (uc *UserController) UpdateUserStatus(c *gin.Context) {
	userId, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	var req struct {
		IsActive bool `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = uc.service.UpdateUserStatus(uint(userId), req.IsActive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新用户状态失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "用户状态已更新",
		"user_id":   userId,
		"is_active": req.IsActive,
	})
}

// DebugUserDatabase 直接从数据库查询用户，用于调试
func (uc *UserController) DebugUserDatabase(c *gin.Context) {
	log.Println("调试: 直接查询数据库中的用户")

	// 获取数据库连接
	db := uc.service.GetDB()

	// 直接查询用户表
	var users []models.User
	result := db.Debug().Find(&users)

	if result.Error != nil {
		log.Printf("调试: 数据库查询错误: %v", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "数据库查询失败",
			"error":   result.Error.Error(),
		})
		return
	}

	log.Printf("调试: 找到 %d 个用户", len(users))

	// 构建安全的响应（移除敏感字段）
	var safeUsers []map[string]interface{}
	for _, user := range users {
		safeUsers = append(safeUsers, map[string]interface{}{
			"id":         user.ID,
			"username":   user.Username,
			"email":      user.Email,
			"full_name":  user.FullName,
			"role":       user.Role,
			"is_active":  user.IsActive,
			"created_at": user.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(users),
		"data":    safeUsers,
	})
}
