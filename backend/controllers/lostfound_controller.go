package controllers

import (
	"net/http"
	"nhcommunity/models"
	"nhcommunity/services"
	"strconv"
	"github.com/gin-gonic/gin"
)

// LostFoundController handles lost and found related endpoints
type LostFoundController struct {
	service services.LostFoundService
}

// NewLostFoundController creates a new lost and found controller
func NewLostFoundController(service services.LostFoundService) *LostFoundController {
	return &LostFoundController{service: service}
}

// GetItems retrieves all lost and found items
func (lc *LostFoundController) GetItems(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	items, err := lc.service.GetItems(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve items"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

// GetItemByID retrieves a single lost and found item by its ID
func (lc *LostFoundController) GetItemByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}
	item, err := lc.service.GetItemByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"item": item})
}

// CreateItem creates a new lost and found item
func (lc *LostFoundController) CreateItem(c *gin.Context) {
	var req models.CreateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	item := &models.LostFound{
		Title:       req.Title,
		Description: req.Description,
		Type:        req.Type,
		Category:    req.Category,
		ImageURLs:   req.ImageURLs,
		Location:    req.Location,
		Date:        req.Date,
		Contact:     req.Contact,
	}
	newItem, err := lc.service.CreateItem(item, userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create item"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"item": newItem})
}

// UpdateItem updates a lost and found item
func (lc *LostFoundController) UpdateItem(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}
	var req models.UpdateLostFoundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userRole := "user"
	updatedItem, err := lc.service.UpdateItem(uint(id), userID.(uint), &req, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"item": updatedItem})
}

// DeleteItem deletes a lost and found item
func (lc *LostFoundController) DeleteItem(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userRole := "user"
	err = lc.service.DeleteItem(uint(id), userID.(uint), userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Item deleted successfully"})
}
