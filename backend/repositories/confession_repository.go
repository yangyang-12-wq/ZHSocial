package repositories

import (
	"nhcommunity/models"

	"gorm.io/gorm"
)

// ConfessionRepository defines the interface for confession data operations
type ConfessionRepository interface {
	FindAll(limit, offset int, preload bool) ([]models.Confession, error)
	FindApproved(limit, offset int) ([]models.Confession, error)
	FindByStatus(status string, limit, offset int) ([]models.Confession, error)
	CountByStatus(status string) (int64, error)
	FindByID(id uint) (*models.Confession, error)
	Create(confession *models.Confession) (*models.Confession, error)
	Update(confession *models.Confession) (*models.Confession, error)
	Delete(confession *models.Confession) error

	FindLike(userID, confessionID uint) (*models.ConfessionLike, error)
	CreateLike(like *models.ConfessionLike) error
	DeleteLike(userID, confessionID uint) error

	FindCommentByID(id uint) (*models.ConfessionComment, error)
	CreateComment(comment *models.ConfessionComment) (*models.ConfessionComment, error)
	UpdateComment(comment *models.ConfessionComment) (*models.ConfessionComment, error)
	DeleteComment(comment *models.ConfessionComment) error

	GetDB() *gorm.DB
}

type confessionRepository struct {
	db *gorm.DB
}

// NewConfessionRepository creates a new instance of ConfessionRepository
func NewConfessionRepository(db *gorm.DB) ConfessionRepository {
	return &confessionRepository{db: db}
}

func (r *confessionRepository) FindAll(limit, offset int, preload bool) ([]models.Confession, error) {
	var confessions []models.Confession
	query := r.db.Limit(limit).Offset(offset).Order("created_at desc")
	if preload {
		query = query.Preload("User")
	}
	err := query.Find(&confessions).Error
	return confessions, err
}

func (r *confessionRepository) FindApproved(limit, offset int) ([]models.Confession, error) {
	var confessions []models.Confession
	err := r.db.Where("is_approved = ?", true).Preload("User").Limit(limit).Offset(offset).Order("created_at desc").Find(&confessions).Error
	return confessions, err
}

func (r *confessionRepository) FindByStatus(status string, limit, offset int) ([]models.Confession, error) {
	var confessions []models.Confession
	err := r.db.Where("status = ?", status).Preload("User").Limit(limit).Offset(offset).Order("created_at desc").Find(&confessions).Error
	return confessions, err
}

func (r *confessionRepository) CountByStatus(status string) (int64, error) {
	var count int64
	err := r.db.Model(&models.Confession{}).Where("status = ?", status).Count(&count).Error
	return count, err
}

func (r *confessionRepository) FindByID(id uint) (*models.Confession, error) {
	var confession models.Confession
	err := r.db.Preload("User").Preload("Comments.User").Preload("Likes").First(&confession, id).Error
	if err != nil {
		return nil, err
	}
	return &confession, nil
}

func (r *confessionRepository) Create(confession *models.Confession) (*models.Confession, error) {
	err := r.db.Create(confession).Error
	return confession, err
}

func (r *confessionRepository) Update(confession *models.Confession) (*models.Confession, error) {
	err := r.db.Save(confession).Error
	return confession, err
}

func (r *confessionRepository) Delete(confession *models.Confession) error {
	return r.db.Delete(confession).Error
}

func (r *confessionRepository) FindLike(userID, confessionID uint) (*models.ConfessionLike, error) {
	var like models.ConfessionLike
	err := r.db.Where("user_id = ? AND confession_id = ?", userID, confessionID).First(&like).Error
	return &like, err
}

func (r *confessionRepository) CreateLike(like *models.ConfessionLike) error {
	return r.db.Create(like).Error
}

func (r *confessionRepository) DeleteLike(userID, confessionID uint) error {
	return r.db.Where("user_id = ? AND confession_id = ?", userID, confessionID).Delete(&models.ConfessionLike{}).Error
}

func (r *confessionRepository) FindCommentByID(id uint) (*models.ConfessionComment, error) {
	var comment models.ConfessionComment
	err := r.db.First(&comment, id).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *confessionRepository) CreateComment(comment *models.ConfessionComment) (*models.ConfessionComment, error) {
	err := r.db.Create(comment).Error
	return comment, err
}

func (r *confessionRepository) UpdateComment(comment *models.ConfessionComment) (*models.ConfessionComment, error) {
	err := r.db.Save(comment).Error
	return comment, err
}

func (r *confessionRepository) DeleteComment(comment *models.ConfessionComment) error {
	return r.db.Delete(comment).Error
}

func (r *confessionRepository) GetDB() *gorm.DB {
	return r.db
}
