package controllers

import (
	"net/http"
	"nhcommunity/models"
	"nhcommunity/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

// MarketplaceController handles marketplace-related endpoints
type MarketplaceController struct {
	service services.MarketplaceService
}

// NewMarketplaceController creates a new marketplace controller
func NewMarketplaceController(service services.MarketplaceService) *MarketplaceController {
	return &MarketplaceController{service: service}
}

// GetListings retrieves all listings
func (mc *MarketplaceController) GetListings(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	listings, err := mc.service.GetListings(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve listings"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"listings": listings})
}

// GetListingByID retrieves a single listing by its ID
func (mc *MarketplaceController) GetListingByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid listing ID"})
		return
	}
	listing, err := mc.service.GetListingByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Listing not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"listing": listing})
}

// CreateListing creates a new listing
func (mc *MarketplaceController) CreateListing(c *gin.Context) {
	var req models.CreateListingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sellerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	listing := &models.Marketplace{
		Title:       req.Title,
		Description: req.Description,
		Price:       req.Price,
		ImageURLs:   req.ImageURLs,
		Category:    req.Category,
		Condition:   req.Condition,
		Location:    req.Location,
	}
	newListing, err := mc.service.CreateListing(listing, sellerID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create listing"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"listing": newListing})
}

// UpdateListing updates a listing
func (mc *MarketplaceController) UpdateListing(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid listing ID"})
		return
	}
	var req models.UpdateListingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sellerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userRole := "user"
	updatedListing, err := mc.service.UpdateListing(uint(id), sellerID.(uint), &req, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"listing": updatedListing})
}

// DeleteListing deletes a listing
func (mc *MarketplaceController) DeleteListing(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid listing ID"})
		return
	}
	sellerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userRole := "user"
	err = mc.service.DeleteListing(uint(id), sellerID.(uint), userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Listing deleted successfully"})
}
