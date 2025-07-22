package services

import (
	"errors"
	"nhcommunity/models"
	"nhcommunity/repositories"

	"gorm.io/gorm"
)

// ConfessionService defines the interface for confession business logic
type ConfessionService interface {
	GetApprovedConfessions(limit, offset int) ([]models.ConfessionResponse, error)
	GetConfessionByID(id, currentUserID uint) (*models.ConfessionResponse, error)
	CreateConfession(req *models.Confession, userID uint) (*models.ConfessionResponse, error)
	UpdateConfessionStatus(id uint, status string, isApproved bool) error
	DeleteConfession(id, userID uint, userRole string) error

	LikeConfession(confessionID, userID uint) error
	UnlikeConfession(confessionID, userID uint) error

	CreateComment(confessionID, userID uint, content string, isAnonymous bool) (*models.ConfessionCommentResponse, error)
	UpdateComment(commentID, userID uint, content string, isAnonymous bool) (*models.ConfessionCommentResponse, error)
	DeleteComment(commentID, userID uint, userRole string) error

	// 管理员相关函数
	GetConfessionsByStatus(status string, limit, offset int) ([]models.Confession, error)
	GetConfessionStats() (int64, int64, int64, error) // 返回待审核、已批准、已拒绝的数量
	GetDB() *gorm.DB
}

type confessionService struct {
	repo repositories.ConfessionRepository
	db   *gorm.DB
}

// NewConfessionService creates a new instance of ConfessionService
func NewConfessionService(repo repositories.ConfessionRepository) ConfessionService {
	return &confessionService{
		repo: repo,
		db:   repo.GetDB(),
	}
}

func (s *confessionService) GetApprovedConfessions(limit, offset int) ([]models.ConfessionResponse, error) {
	confessions, err := s.repo.FindApproved(limit, offset)
	if err != nil {
		return nil, err
	}
	var responses []models.ConfessionResponse
	for _, c := range confessions {
		responses = append(responses, c.ToResponse(0)) // User not logged in, so no like status
	}
	return responses, nil
}

func (s *confessionService) GetConfessionByID(id, currentUserID uint) (*models.ConfessionResponse, error) {
	confession, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if !confession.IsApproved {
		return nil, errors.New("confession not found or not approved")
	}
	response := confession.ToResponse(currentUserID)
	return &response, nil
}

func (s *confessionService) CreateConfession(confession *models.Confession, userID uint) (*models.ConfessionResponse, error) {
	confession.UserID = userID
	confession.Status = "approved" // 直接设置为已批准
	confession.IsApproved = true   // 直接批准树洞
	newConfession, err := s.repo.Create(confession)
	if err != nil {
		return nil, err
	}
	response := newConfession.ToResponse(userID)
	return &response, nil
}

func (s *confessionService) UpdateConfessionStatus(id uint, status string, isApproved bool) error {
	confession, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	confession.Status = status
	confession.IsApproved = isApproved
	_, err = s.repo.Update(confession)
	return err
}

func (s *confessionService) DeleteConfession(id, userID uint, userRole string) error {
	confession, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if confession.UserID != userID && userRole != "admin" {
		return errors.New("permission denied")
	}
	return s.repo.Delete(confession)
}

func (s *confessionService) LikeConfession(confessionID, userID uint) error {
	_, err := s.repo.FindLike(userID, confessionID)
	if err == nil {
		return errors.New("already liked")
	}
	like := &models.ConfessionLike{
		UserID:       userID,
		ConfessionID: confessionID,
	}
	return s.repo.CreateLike(like)
}

func (s *confessionService) UnlikeConfession(confessionID, userID uint) error {
	return s.repo.DeleteLike(userID, confessionID)
}

func (s *confessionService) CreateComment(confessionID, userID uint, content string, isAnonymous bool) (*models.ConfessionCommentResponse, error) {
	comment := &models.ConfessionComment{
		ConfessionID: confessionID,
		UserID:       userID,
		Content:      content,
		IsAnonymous:  isAnonymous,
	}
	newComment, err := s.repo.CreateComment(comment)
	if err != nil {
		return nil, err
	}
	response := newComment.ToResponse()
	return &response, nil
}

func (s *confessionService) UpdateComment(commentID, userID uint, content string, isAnonymous bool) (*models.ConfessionCommentResponse, error) {
	comment, err := s.repo.FindCommentByID(commentID)
	if err != nil {
		return nil, err
	}
	if comment.UserID != userID {
		return nil, errors.New("permission denied")
	}
	comment.Content = content
	comment.IsAnonymous = isAnonymous
	updatedComment, err := s.repo.UpdateComment(comment)
	if err != nil {
		return nil, err
	}
	response := updatedComment.ToResponse()
	return &response, nil
}

func (s *confessionService) DeleteComment(commentID, userID uint, userRole string) error {
	comment, err := s.repo.FindCommentByID(commentID)
	if err != nil {
		return err
	}
	if comment.UserID != userID && userRole != "admin" {
		return errors.New("permission denied")
	}
	return s.repo.DeleteComment(comment)
}

// GetDB 返回数据库连接
func (s *confessionService) GetDB() *gorm.DB {
	return s.db
}

// GetConfessionsByStatus 根据状态获取树洞列表
func (s *confessionService) GetConfessionsByStatus(status string, limit, offset int) ([]models.Confession, error) {
	if status == "" {
		return s.repo.FindAll(limit, offset, true)
	}
	return s.repo.FindByStatus(status, limit, offset)
}

// GetConfessionStats 获取树洞状态统计
func (s *confessionService) GetConfessionStats() (int64, int64, int64, error) {
	pendingCount, err := s.repo.CountByStatus("pending")
	if err != nil {
		return 0, 0, 0, err
	}

	approvedCount, err := s.repo.CountByStatus("approved")
	if err != nil {
		return 0, 0, 0, err
	}

	rejectedCount, err := s.repo.CountByStatus("rejected")
	if err != nil {
		return 0, 0, 0, err
	}

	return pendingCount, approvedCount, rejectedCount, nil
}
