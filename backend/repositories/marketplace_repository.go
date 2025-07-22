package repositories
import (
	"nhcommunity/models"

	"gorm.io/gorm"
)

// MarketplaceRepository defines the interface for marketplace data operations
type MarketplaceRepository interface {
	FindAll(limit, offset int) ([]models.Marketplace, error)
	FindByID(id uint) (*models.Marketplace, error)
	Create(listing *models.Marketplace) (*models.Marketplace, error)
	Update(listing *models.Marketplace) (*models.Marketplace, error)
	Delete(listing *models.Marketplace) error
}

type marketplaceRepository struct {
	db *gorm.DB
}

// NewMarketplaceRepository creates a new instance of MarketplaceRepository
func NewMarketplaceRepository(db *gorm.DB) MarketplaceRepository {
	return &marketplaceRepository{db: db}
}

func (r *marketplaceRepository) FindAll(limit, offset int) ([]models.Marketplace, error) {
	var listings []models.Marketplace
	err := r.db.Preload("Seller").Limit(limit).Offset(offset).Order("created_at desc").Find(&listings).Error
	return listings, err
}

func (r *marketplaceRepository) FindByID(id uint) (*models.Marketplace, error) {
	var listing models.Marketplace
	err := r.db.Preload("Seller").First(&listing, id).Error
	if err != nil {
		return nil, err
	}
	return &listing, nil
}

func (r *marketplaceRepository) Create(listing *models.Marketplace) (*models.Marketplace, error) {
	err := r.db.Create(listing).Error
	return listing, err
}

func (r *marketplaceRepository) Update(listing *models.Marketplace) (*models.Marketplace, error) {
	err := r.db.Save(listing).Error
	return listing, err
}

func (r *marketplaceRepository) Delete(listing *models.Marketplace) error {
	return r.db.Delete(listing).Error
}

