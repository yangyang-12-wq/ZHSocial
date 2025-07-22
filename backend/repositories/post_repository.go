package repositories

import (
	"nhcommunity/models"

	"gorm.io/gorm"
)

// PostRepository defines the interface for post data operations
type PostRepository interface {
	FindAll(limit, offset int) ([]models.Post, error)
	FindByID(id uint) (*models.Post, error)
	Create(post *models.Post) (*models.Post, error)
	Update(post *models.Post) (*models.Post, error)
	Delete(post *models.Post) error
	SearchPosts(keyword string, page, limit int, sort string) ([]models.Post, int64, error)

	FindLike(userID, postID uint) (*models.Like, error)
	CreateLike(like *models.Like) error
	DeleteLike(userID, postID uint) error

	FindCommentByID(id uint) (*models.Comment, error)
	CreateComment(comment *models.Comment) (*models.Comment, error)
	UpdateComment(comment *models.Comment) (*models.Comment, error)
	DeleteComment(comment *models.Comment) error
}

type postRepository struct {
	db *gorm.DB
}

// NewPostRepository creates a new instance of PostRepository
func NewPostRepository(db *gorm.DB) PostRepository {
	return &postRepository{db: db}
}

func (r *postRepository) FindAll(limit, offset int) ([]models.Post, error) {
	var posts []models.Post
	err := r.db.Preload("User").Limit(limit).Offset(offset).Order("created_at desc").Find(&posts).Error
	return posts, err
}

func (r *postRepository) FindByID(id uint) (*models.Post, error) {
	var post models.Post
	err := r.db.Preload("User").Preload("Comments.User").Preload("Likes").First(&post, id).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *postRepository) Create(post *models.Post) (*models.Post, error) {
	err := r.db.Create(post).Error
	return post, err
}

func (r *postRepository) Update(post *models.Post) (*models.Post, error) {
	err := r.db.Save(post).Error
	return post, err
}

func (r *postRepository) Delete(post *models.Post) error {
	return r.db.Delete(post).Error
}

func (r *postRepository) SearchPosts(keyword string, page, limit int, sort string) ([]models.Post, int64, error) {
	var posts []models.Post
	var total int64

	query := r.db.Model(&models.Post{}).Preload("User")

	if keyword != "" {
		query = query.Where("title LIKE ? OR content LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	// 先计算总数
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// 添加排序
	switch sort {
	case "hot":
		// 这里的 "hot" 排序逻辑可能需要根据点赞数、评论数或浏览量等来实现
		// 暂时我们先按创建时间排序
		query = query.Order("created_at DESC")
	default: // newest
		query = query.Order("created_at DESC")
	}

	// 添加分页
	offset := (page - 1) * limit
	err = query.Offset(offset).Limit(limit).Find(&posts).Error

	return posts, total, err
}

func (r *postRepository) FindLike(userID, postID uint) (*models.Like, error) {
	var like models.Like
	err := r.db.Where("user_id = ? AND post_id = ?", userID, postID).First(&like).Error
	return &like, err
}

func (r *postRepository) CreateLike(like *models.Like) error {
	var post models.Post
	if err := r.db.First(&post, like.PostID).Error; err != nil {
		return err
	}
	return r.db.Create(like).Error
}

func (r *postRepository) DeleteLike(userID, postID uint) error {
	return r.db.Where("user_id = ? AND post_id = ?", userID, postID).Delete(&models.Like{}).Error
}

func (r *postRepository) FindCommentByID(id uint) (*models.Comment, error) {
	var comment models.Comment
	err := r.db.First(&comment, id).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *postRepository) CreateComment(comment *models.Comment) (*models.Comment, error) {
	err := r.db.Create(comment).Error
	return comment, err
}

func (r *postRepository) UpdateComment(comment *models.Comment) (*models.Comment, error) {
	err := r.db.Save(comment).Error
	return comment, err
}

func (r *postRepository) DeleteComment(comment *models.Comment) error {
	return r.db.Delete(comment).Error
}
