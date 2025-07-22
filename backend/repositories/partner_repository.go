package repositories

import (
	"nhcommunity/models"

	"gorm.io/gorm"
)

type PartnerRepository interface {
	Create(partner *models.Partner) error
	FindAll(params map[string]string, page, limit int) ([]models.Partner, int64, error)
	FindByID(id string) (*models.Partner, error)
	Update(partner *models.Partner) error
	Delete(id string) error
	AddParticipant(partnerID string, userID string) error
	RemoveParticipant(partnerID string, userID string) error
	IsParticipant(partnerID string, userID string) (bool, error)
	UpdateTags(partnerID string, tags []string) error
	FindCategories() ([]string, error)
	FindTypes() ([]string, error)
}

type partnerRepository struct {
	db *gorm.DB
}

func NewPartnerRepository(db *gorm.DB) PartnerRepository {
	return &partnerRepository{db: db}
}

func (r *partnerRepository) Create(partner *models.Partner) error {
	return r.db.Create(partner).Error
}

func (r *partnerRepository) FindAll(params map[string]string, page, limit int) ([]models.Partner, int64, error) {
	var partners []models.Partner
	var total int64
	query := r.db.Model(&models.Partner{}).Preload("Author").Preload("Tags")

	if category, ok := params["category"]; ok && category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}
	if pType, ok := params["type"]; ok && pType != "" && pType != "all" {
		query = query.Where("type = ?", pType)
	}
	if keyword, ok := params["keyword"]; ok && keyword != "" {
		query = query.Where("title LIKE ? OR description LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := query.Order("created_at desc").Offset(offset).Limit(limit).Find(&partners).Error
	return partners, total, err
}

func (r *partnerRepository) FindByID(id string) (*models.Partner, error) {
	var partner models.Partner
	err := r.db.Preload("Author").Preload("Participants").Preload("Tags").First(&partner, "id = ?", id).Error
	return &partner, err
}

func (r *partnerRepository) Update(partner *models.Partner) error {
	return r.db.Session(&gorm.Session{FullSaveAssociations: true}).Save(partner).Error
}

func (r *partnerRepository) Delete(id string) error {
	return r.db.Delete(&models.Partner{}, "id = ?", id).Error
}

func (r *partnerRepository) AddParticipant(partnerID string, userID string) error {
	var partner models.Partner
	if err := r.db.First(&partner, "id = ?", partnerID).Error; err != nil {
		return err
	}
	var user models.User
	if err := r.db.First(&user, "id = ?", userID).Error; err != nil {
		return err
	}
	if err := r.db.Model(&partner).Association("Participants").Append(&user); err != nil {
		return err
	}
	// Increment current participants count
	return r.db.Model(&partner).Update("current_participants", gorm.Expr("current_participants + 1")).Error
}

func (r *partnerRepository) RemoveParticipant(partnerID string, userID string) error {
	var partner models.Partner
	if err := r.db.First(&partner, "id = ?", partnerID).Error; err != nil {
		return err
	}
	var user models.User
	if err := r.db.First(&user, "id = ?", userID).Error; err != nil {
		return err
	}
	if err := r.db.Model(&partner).Association("Participants").Delete(&user); err != nil {
		return err
	}
	// Decrement current participants count
	return r.db.Model(&partner).Update("current_participants", gorm.Expr("current_participants - 1")).Error
}

func (r *partnerRepository) IsParticipant(partnerID string, userID string) (bool, error) {
	var count int64
	err := r.db.Table("partner_participants").Where("partner_id = ? AND user_id = ?", partnerID, userID).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *partnerRepository) UpdateTags(partnerID string, tags []string) error {
	// Start a transaction
	tx := r.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	// Delete existing tags for the partner
	if err := tx.Where("partner_id = ?", partnerID).Delete(&models.PartnerTag{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Add new tags
	if len(tags) > 0 {
		newTags := make([]models.PartnerTag, len(tags))
		for i, tagName := range tags {
			newTags[i] = models.PartnerTag{PartnerID: partnerID, Tag: tagName}
		}
		if err := tx.Create(&newTags).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

func (r *partnerRepository) FindCategories() ([]string, error) {
	var categories []string
	err := r.db.Model(&models.Partner{}).Distinct().Pluck("category", &categories).Error
	return categories, err
}

func (r *partnerRepository) FindTypes() ([]string, error) {
	var types []string
	err := r.db.Model(&models.Partner{}).Distinct().Pluck("type", &types).Error
	return types, err
}
