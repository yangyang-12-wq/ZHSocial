package controllers

import (
	"fmt"
	"log"
	"net/http"
	"nhcommunity/models"
	"nhcommunity/services"
	"strconv"

	"nhcommunity/repositories"
	"nhcommunity/utils"

	"github.com/gin-gonic/gin"
)

// ConfessionController handles confession-related endpoints
type ConfessionController struct {
	service services.ConfessionService
}

// NewConfessionController creates a new confession controller
func NewConfessionController(service services.ConfessionService) *ConfessionController {
	return &ConfessionController{service: service}
}

// GetConfessions retrieves all approved confessions
func (cc *ConfessionController) GetConfessions(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	responses, err := cc.service.GetApprovedConfessions(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve confessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"confessions": responses})
}

// GetConfessionByID retrieves a single confession by its ID
func (cc *ConfessionController) GetConfessionByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid confession ID"})
		return
	}

	userID, _ := c.Get("user_id")
	currentUserID, _ := userID.(uint)

	response, err := cc.service.GetConfessionByID(uint(id), currentUserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"confession": response})
}

// CreateConfession creates a new confession
func (cc *ConfessionController) CreateConfession(c *gin.Context) {
	var req models.CreateConfessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	confession := &models.Confession{
		Content:     req.Content,
		ImageURL:    req.ImageURL,
		IsAnonymous: req.IsAnonymous,
	}

	response, err := cc.service.CreateConfession(confession, userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create confession"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Confession submitted for approval", "confession": response})
}

// UpdateConfession updates a confession, mainly for admin approval
func (cc *ConfessionController) UpdateConfession(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid confession ID"})
		return
	}

	var req models.UpdateConfessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = cc.service.UpdateConfessionStatus(uint(id), req.Status, *req.IsApproved)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update confession"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Confession updated successfully"})
}

// DeleteConfession deletes a confession
// Only the owner or an admin can delete a confession
func (cc *ConfessionController) DeleteConfession(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid confession ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// For simplicity, passing role as string. In a real app, use a proper enum or const.
	userRole := "user" // This should be fetched from user claims

	err = cc.service.DeleteConfession(uint(id), userID.(uint), userRole)
	if err != nil {
		if err.Error() == "permission denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to delete this confession"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete confession"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Confession deleted successfully"})
}

// LikeConfession handles liking a confession
func (cc *ConfessionController) LikeConfession(c *gin.Context) {
	confessionID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid confession ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	err = cc.service.LikeConfession(uint(confessionID), userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to like confession"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Confession liked successfully"})
}

// UnlikeConfession handles unliking a confession
func (cc *ConfessionController) UnlikeConfession(c *gin.Context) {
	confessionID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid confession ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	err = cc.service.UnlikeConfession(uint(confessionID), userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlike confession"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Confession unliked successfully"})
}

// CreateComment handles creating a comment on a confession
func (cc *ConfessionController) CreateComment(c *gin.Context) {
	confessionID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid confession ID"})
		return
	}

	var req models.ConfessionCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	response, err := cc.service.CreateComment(uint(confessionID), userID.(uint), req.Content, req.IsAnonymous)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"comment": response})
}

// UpdateComment handles updating a comment
func (cc *ConfessionController) UpdateComment(c *gin.Context) {
	commentID, err := strconv.ParseUint(c.Param("commentId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	var req models.ConfessionCommentRequest // Reusing the create request for update
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	response, err := cc.service.UpdateComment(uint(commentID), userID.(uint), req.Content, req.IsAnonymous)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"comment": response})
}

// DeleteComment handles deleting a comment
func (cc *ConfessionController) DeleteComment(c *gin.Context) {
	commentID, err := strconv.ParseUint(c.Param("commentId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userRole := "user" // This should be fetched from user claims

	err = cc.service.DeleteComment(uint(commentID), userID.(uint), userRole)
	if err != nil {
		if err.Error() == "permission denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": "You cannot delete this comment"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted successfully"})
}

// GetAdminConfessions 获取管理员视图的树洞列表（包括未审核的内容）
func (cc *ConfessionController) GetAdminConfessions(c *gin.Context) {
	status := c.DefaultQuery("status", "")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	confessions, err := cc.service.GetConfessionsByStatus(status, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve confessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Confessions retrieved successfully",
		"data":    confessions,
	})
}

// UpdateConfessionStatus 更新树洞的审核状态（管理员API）
func (cc *ConfessionController) UpdateConfessionStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid confession ID"})
		return
	}

	var req models.UpdateConfessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 必须提供status和isApproved字段
	if req.Status == "" || req.IsApproved == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status and isApproved are required"})
		return
	}

	err = cc.service.UpdateConfessionStatus(uint(id), req.Status, *req.IsApproved)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update confession status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Confession status updated successfully"})
}

// GetAdminStats 获取管理员统计数据
func (cc *ConfessionController) GetAdminStats(c *gin.Context) {
	// 记录请求用户信息
	userID, exists := c.Get("user_id")
	fmt.Printf("GetAdminStats: 请求用户ID: %v, 存在: %v\n", userID, exists)
	
	// 获取claims中的角色
	claims, exists := c.Get("claims")
	if exists {
		if jwtClaims, ok := claims.(*utils.JWTClaims); ok {
			fmt.Printf("GetAdminStats: JWT中的角色: %s\n", jwtClaims.Role)
		} else {
			fmt.Println("GetAdminStats: claims类型不是JWTClaims")
		}
	} else {
		fmt.Println("GetAdminStats: 未找到claims")
	}
	
	// 初始化默认值
	var (
		pendingCount  int64 = 0
		approvedCount int64 = 0
		rejectedCount int64 = 0
		totalUsers    int64 = 0
	)

	// 尝试获取树洞统计数据，但不因错误中断
	pendingTmp, approvedTmp, rejectedTmp, err := cc.service.GetConfessionStats()
	if err == nil {
		pendingCount = pendingTmp
		approvedCount = approvedTmp
		rejectedCount = rejectedTmp
	} else {
		log.Printf("获取树洞统计失败: %v", err)
	}

	// 获取用户总数
	userRepo := repositories.NewUserRepository(cc.service.GetDB())
	userCount, err := userRepo.CountUsers()
	if err == nil {
		totalUsers = userCount
	} else {
		log.Printf("获取用户总数失败: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"pendingCount":  pendingCount,
		"approvedCount": approvedCount,
		"rejectedCount": rejectedCount,
		"totalUsers":    totalUsers,
	})
}
