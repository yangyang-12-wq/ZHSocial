package controllers

import (
	"net/http"
	"nhcommunity/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ChatController struct {
	service services.ChatService
	hub     *services.Hub
}

func NewChatController(service services.ChatService, hub *services.Hub) *ChatController {
	return &ChatController{
		service: service,
		hub:     hub,
	}
}

// ServeWs handles the WebSocket connection request.
// It passes the context to the chat service, which will upgrade the connection.
func (cc *ChatController) ServeWs(c *gin.Context) {
	cc.service.ServeWs(cc.hub, c)
}

func (cc *ChatController) GetConversations(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	conversations, err := cc.service.GetConversations(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to retrieve conversations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": conversations})
}

func (cc *ChatController) GetMessages(c *gin.Context) {
	conversationID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid conversation ID"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	messages, err := cc.service.GetMessages(uint(conversationID), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to retrieve messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": messages})
}

func (cc *ChatController) CreateChatSession(c *gin.Context) {
	var req struct {
		UserID uint `json:"userId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid request body"})
		return
	}

	userID, _ := c.Get("user_id")
	currentUser := userID.(uint)

	if currentUser == req.UserID {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "You cannot start a conversation with yourself"})
		return
	}

	convo, err := cc.service.GetOrCreateConversation(currentUser, req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to create or find conversation"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"sessionId": convo.ID,
		},
	})
}
