package services

import (
	"errors"
	"nhcommunity/models"
	"nhcommunity/repositories"
	"strconv"

	"github.com/google/uuid"
)

type PartnerService interface {
	CreatePartner(req *models.CreatePartnerRequest, authorID uint) (*models.Partner, error)
	GetPartners(params map[string]string, page, limit int) ([]models.Partner, int64, error)
	GetPartnerByID(id string) (*models.Partner, error)
	UpdatePartner(id string, req *models.UpdatePartnerRequest, userID uint) (*models.Partner, error)
	DeletePartner(id string, userID uint) error
	JoinPartner(partnerID string, userID uint) error
	LeavePartner(partnerID string, userID uint) error
	GetPartnerCategories() ([]string, error)
	GetPartnerTypes() ([]string, error)
}

type partnerService struct {
	repo repositories.PartnerRepository
}

func NewPartnerService(repo repositories.PartnerRepository) PartnerService {
	return &partnerService{repo: repo}
}

func (s *partnerService) CreatePartner(req *models.CreatePartnerRequest, authorID uint) (*models.Partner, error) {
	partnerID := uuid.New().String()
	partner := &models.Partner{
		ID:                  partnerID,
		Title:               req.Title,
		Description:         req.Description,
		Category:            req.Category,
		Type:                req.Type,
		Status:              "open",
		Location:            req.Location,
		TimePreference:      req.TimePreference,
		MaxParticipants:     req.MaxParticipants,
		CurrentParticipants: 1,
		ExpiresAt:           req.ExpiresAt,
		AuthorID:            strconv.FormatUint(uint64(authorID), 10), // 将 uint 转换为 string
	}

	if len(req.Tags) > 0 {
		tags := make([]models.PartnerTag, len(req.Tags))
		for i, tagName := range req.Tags {
			tags[i] = models.PartnerTag{
				PartnerID: partnerID,
				Tag:       tagName,
			}
		}
		partner.Tags = tags
	}

	if err := s.repo.Create(partner); err != nil {
		return nil, err
	}
	return s.repo.FindByID(partnerID)
}

func (s *partnerService) GetPartners(params map[string]string, page, limit int) ([]models.Partner, int64, error) {
	return s.repo.FindAll(params, page, limit)
}

func (s *partnerService) GetPartnerByID(id string) (*models.Partner, error) {
	return s.repo.FindByID(id)
}

func (s *partnerService) UpdatePartner(id string, req *models.UpdatePartnerRequest, userID uint) (*models.Partner, error) {
	partner, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// 将 userID 转换为 string 以进行比较
	userIDStr := strconv.FormatUint(uint64(userID), 10)
	if partner.AuthorID != userIDStr {
		return nil, errors.New("user is not the author")
	}

	if req.Title != "" {
		partner.Title = req.Title
	}
	if req.Description != "" {
		partner.Description = req.Description
	}
	if req.Category != "" {
		partner.Category = req.Category
	}
	if req.Type != "" {
		partner.Type = req.Type
	}
	if req.Status != "" {
		partner.Status = req.Status
	}
	if req.Location != "" {
		partner.Location = req.Location
	}
	if req.TimePreference != "" {
		partner.TimePreference = req.TimePreference
	}
	if req.MaxParticipants > 1 {
		partner.MaxParticipants = req.MaxParticipants
	}
	if req.ExpiresAt != nil {
		partner.ExpiresAt = req.ExpiresAt
	}

	// 更新标签 - 不使用 UpdateTags 方法
	if req.Tags != nil {
		newTags := make([]models.PartnerTag, len(req.Tags))
		for i, tagName := range req.Tags {
			newTags[i] = models.PartnerTag{
				PartnerID: id,
				Tag:       tagName,
			}
		}
		partner.Tags = newTags
	}

	if err := s.repo.Update(partner); err != nil {
		return nil, err
	}
	return s.repo.FindByID(id)
}

func (s *partnerService) DeletePartner(id string, userID uint) error {
	partner, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	// 将 userID 转换为 string 以进行比较
	userIDStr := strconv.FormatUint(uint64(userID), 10)
	if partner.AuthorID != userIDStr {
		return errors.New("user is not the author")
	}
	return s.repo.Delete(id)
}

func (s *partnerService) JoinPartner(partnerID string, userID uint) error {
	partner, err := s.repo.FindByID(partnerID)
	if err != nil {
		return err
	}
	if partner.Status != "open" {
		return errors.New("partner is not open for joining")
	}
	if partner.CurrentParticipants >= partner.MaxParticipants {
		return errors.New("partner is full")
	}

	// 将 userID 转换为 string 以进行比较
	userIDStr := strconv.FormatUint(uint64(userID), 10)
	if partner.AuthorID == userIDStr {
		return errors.New("author cannot join their own partner request")
	}

	// 手动检查用户是否已经参与
	var isParticipant bool
	for _, p := range partner.Participants {
		if strconv.FormatUint(uint64(p.ID), 10) == userIDStr {
			isParticipant = true
			break
		}
	}
	if isParticipant {
		return errors.New("user already joined")
	}

	return s.repo.AddParticipant(partnerID, userIDStr)
}

func (s *partnerService) LeavePartner(partnerID string, userID uint) error {
	partner, err := s.repo.FindByID(partnerID)
	if err != nil {
		return err
	}

	// 将 userID 转换为 string 以进行比较
	userIDStr := strconv.FormatUint(uint64(userID), 10)

	// 手动检查用户是否是参与者
	isParticipant := false
	for _, p := range partner.Participants {
		if strconv.FormatUint(uint64(p.ID), 10) == userIDStr {
			isParticipant = true
			break
		}
	}
	if !isParticipant {
		return errors.New("user is not a participant")
	}

	return s.repo.RemoveParticipant(partnerID, userIDStr)
}

func (s *partnerService) GetPartnerCategories() ([]string, error) {
	return s.repo.FindCategories()
}

func (s *partnerService) GetPartnerTypes() ([]string, error) {
	return s.repo.FindTypes()
}
