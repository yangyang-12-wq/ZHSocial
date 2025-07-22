package repositories
import (
	"nhcommunity/models"

	"gorm.io/gorm"
)

// LostFoundRepository defines the interface for lost and found data operations
type LostFoundRepository interface {
	FindAll(limit, offset int) ([]models.LostFound, error)
	FindByID(id uint) (*models.LostFound, error)
	Create(item *models.LostFound) (*models.LostFound, error)
	Update(item *models.LostFound) (*models.LostFound, error)
	Delete(item *models.LostFound) error
}

type lostFoundRepository struct {
	db *gorm.DB
}

// NewLostFoundRepository creates a new instance of LostFoundRepository
func NewLostFoundRepository(db *gorm.DB) LostFoundRepository {
	return &lostFoundRepository{db: db}
}

func (r *lostFoundRepository) FindAll(limit, offset int) ([]models.LostFound, error) {
	var items []models.LostFound
	err := r.db.Preload("User").Limit(limit).Offset(offset).Order("created_at desc").Find(&items).Error
	return items, err
}

func (r *lostFoundRepository) FindByID(id uint) (*models.LostFound, error) {
	var item models.LostFound
	err := r.db.Preload("User").First(&item, id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *lostFoundRepository) Create(item *models.LostFound) (*models.LostFound, error) {
	err := r.db.Create(item).Error
	return item, err
}

func (r *lostFoundRepository) Update(item *models.LostFound) (*models.LostFound, error) {
	err := r.db.Save(item).Error
	return item, err
}

func (r *lostFoundRepository) Delete(item *models.LostFound) error {
	return r.db.Delete(item).Error
}

