package services
import (
	"errors"
	"nhcommunity/models"
	"nhcommunity/repositories"
)

// LostFoundService defines the interface for lost and found business logic
type LostFoundService interface {
	GetItems(limit, offset int) ([]models.LostFoundResponse, error)
	GetItemByID(id uint) (*models.LostFoundResponse, error)
	CreateItem(item *models.LostFound, userID uint) (*models.LostFoundResponse, error)
	UpdateItem(id, userID uint, req *models.UpdateLostFoundRequest, userRole string) (*models.LostFoundResponse, error)
	DeleteItem(id, userID uint, userRole string) error
}

type lostFoundService struct {
	repo repositories.LostFoundRepository
}

// NewLostFoundService creates a new instance of LostFoundService
func NewLostFoundService(repo repositories.LostFoundRepository) LostFoundService {
	return &lostFoundService{repo: repo}
}

func (s *lostFoundService) GetItems(limit, offset int) ([]models.LostFoundResponse, error) {
	items, err := s.repo.FindAll(limit, offset)
	if err != nil {
		return nil, err
	}
	var responses []models.LostFoundResponse
	for _, i := range items {
		responses = append(responses, i.ToResponse())
	}
	return responses, nil
}

func (s *lostFoundService) GetItemByID(id uint) (*models.LostFoundResponse, error) {
	item, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	response := item.ToResponse()
	return &response, nil
}

func (s *lostFoundService) CreateItem(item *models.LostFound, userID uint) (*models.LostFoundResponse, error) {
	item.UserID = userID
	newItem, err := s.repo.Create(item)
	if err != nil {
		return nil, err
	}
	response := newItem.ToResponse()
	return &response, nil
}

func (s *lostFoundService) UpdateItem(id, userID uint, req *models.UpdateLostFoundRequest, userRole string) (*models.LostFoundResponse, error) {
	item, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if item.UserID != userID && userRole != "admin" {
		return nil, errors.New("permission denied")
	}

	if req.Title != "" {
		item.Title = req.Title
	}
	if req.Description != "" {
		item.Description = req.Description
	}
	if req.Type != "" {
		item.Type = req.Type
	}
	if req.Category != "" {
		item.Category = req.Category
	}
	if req.ImageURLs != "" {
		item.ImageURLs = req.ImageURLs
	}
	if req.Location != "" {
		item.Location = req.Location
	}
	if !req.Date.IsZero() {
		item.Date = req.Date
	}
	if req.Status != "" {
		item.Status = req.Status
	}
	if req.Contact != "" {
		item.Contact = req.Contact
	}

	updatedItem, err := s.repo.Update(item)
	if err != nil {
		return nil, err
	}
	response := updatedItem.ToResponse()
	return &response, nil
}

func (s *lostFoundService) DeleteItem(id, userID uint, userRole string) error {
	item, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if item.UserID != userID && userRole != "admin" {
		return errors.New("permission denied")
	}
	return s.repo.Delete(item)
}

