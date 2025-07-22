package services
import (
	"errors"
	"nhcommunity/models"
	"nhcommunity/repositories"
)

// MarketplaceService defines the interface for marketplace business logic
type MarketplaceService interface {
	GetListings(limit, offset int) ([]models.MarketplaceResponse, error)
	GetListingByID(id uint) (*models.MarketplaceResponse, error)
	CreateListing(listing *models.Marketplace, sellerID uint) (*models.MarketplaceResponse, error)
	UpdateListing(id, sellerID uint, req *models.UpdateListingRequest, userRole string) (*models.MarketplaceResponse, error)
	DeleteListing(id, sellerID uint, userRole string) error
}

type marketplaceService struct {
	repo repositories.MarketplaceRepository
}

// NewMarketplaceService creates a new instance of MarketplaceService
func NewMarketplaceService(repo repositories.MarketplaceRepository) MarketplaceService {
	return &marketplaceService{repo: repo}
}

func (s *marketplaceService) GetListings(limit, offset int) ([]models.MarketplaceResponse, error) {
	listings, err := s.repo.FindAll(limit, offset)
	if err != nil {
		return nil, err
	}
	var responses []models.MarketplaceResponse
	for _, l := range listings {
		responses = append(responses, l.ToResponse())
	}
	return responses, nil
}

func (s *marketplaceService) GetListingByID(id uint) (*models.MarketplaceResponse, error) {
	listing, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	response := listing.ToResponse()
	return &response, nil
}

func (s *marketplaceService) CreateListing(listing *models.Marketplace, sellerID uint) (*models.MarketplaceResponse, error) {
	listing.SellerID = sellerID
	newListing, err := s.repo.Create(listing)
	if err != nil {
		return nil, err
	}
	response := newListing.ToResponse()
	return &response, nil
}

func (s *marketplaceService) UpdateListing(id, sellerID uint, req *models.UpdateListingRequest, userRole string) (*models.MarketplaceResponse, error) {
	listing, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if listing.SellerID != sellerID && userRole != "admin" {
		return nil, errors.New("permission denied")
	}

	if req.Title != "" {
		listing.Title = req.Title
	}
	if req.Description != "" {
		listing.Description = req.Description
	}
	if req.Price != nil {
		listing.Price = *req.Price
	}
	if req.ImageURLs != "" {
		listing.ImageURLs = req.ImageURLs
	}
	if req.Category != "" {
		listing.Category = req.Category
	}
	if req.Condition != "" {
		listing.Condition = req.Condition
	}
	if req.Status != "" {
		listing.Status = req.Status
	}
	if req.Location != "" {
		listing.Location = req.Location
	}

	updatedListing, err := s.repo.Update(listing)
	if err != nil {
		return nil, err
	}
	response := updatedListing.ToResponse()
	return &response, nil
}

func (s *marketplaceService) DeleteListing(id, sellerID uint, userRole string) error {
	listing, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if listing.SellerID != sellerID && userRole != "admin" {
		return errors.New("permission denied")
	}
	return s.repo.Delete(listing)
}

