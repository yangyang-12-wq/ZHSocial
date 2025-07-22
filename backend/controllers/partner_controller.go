package controllers

import (
	"errors"
	"net/http"
	"nhcommunity/models"
	"nhcommunity/services"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PartnerController struct {
	service services.PartnerService
}

func NewPartnerController(service services.PartnerService) *PartnerController {
	return &PartnerController{service: service}
}

// CreatePartner handles the creation of a new partner
func (pc *PartnerController) CreatePartner(c *gin.Context) {
	var req models.CreatePartnerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	partner, err := pc.service.CreatePartner(&req, userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to create partner"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": partner.ToResponse()})
}

// GetPartners handles fetching a list of partners
func (pc *PartnerController) GetPartners(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	params := map[string]string{
		"category": c.Query("category"),
		"type":     c.Query("type"),
		"keyword":  c.Query("keyword"),
	}

	partners, total, err := pc.service.GetPartners(params, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch partners"})
		return
	}

	responses := make([]models.PartnerResponse, len(partners))
	for i, p := range partners {
		responses[i] = p.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    responses,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetPartnerByID handles fetching a single partner by ID
func (pc *PartnerController) GetPartnerByID(c *gin.Context) {
	id := c.Param("id")
	partner, err := pc.service.GetPartnerByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Partner not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to retrieve partner"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": partner.ToResponse()})
}

// UpdatePartner handles updating a partner
func (pc *PartnerController) UpdatePartner(c *gin.Context) {
	id := c.Param("id")
	var req models.UpdatePartnerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}
	partner, err := pc.service.UpdatePartner(id, &req, userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": partner.ToResponse()})
}

// DeletePartner handles deleting a partner
func (pc *PartnerController) DeletePartner(c *gin.Context) {
	id := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}
	err := pc.service.DeletePartner(id, userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Partner deleted successfully"})
}

// JoinPartner handles a user joining a partner group
func (pc *PartnerController) JoinPartner(c *gin.Context) {
	partnerID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	err := pc.service.JoinPartner(partnerID, userID.(uint))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Successfully joined partner"})
}

// LeavePartner handles a user leaving a partner group
func (pc *PartnerController) LeavePartner(c *gin.Context) {
	partnerID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	err := pc.service.LeavePartner(partnerID, userID.(uint))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Successfully left partner"})
}

// GetPartnerCategories handles fetching partner categories
func (pc *PartnerController) GetPartnerCategories(c *gin.Context) {
	categories, err := pc.service.GetPartnerCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch categories"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": categories})
}

// GetPartnerTypes handles fetching partner types
func (pc *PartnerController) GetPartnerTypes(c *gin.Context) {
	types, err := pc.service.GetPartnerTypes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch types"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": types})
}
