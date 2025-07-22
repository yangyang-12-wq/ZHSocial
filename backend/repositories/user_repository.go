package repositories

import (
	"errors"
	"log"
	"nhcommunity/models"
	"strings"

	"gorm.io/gorm"
)

var (
	ErrUserNotFound    = errors.New("user not found")
	ErrEmailExists     = errors.New("email already exists")
	ErrUsernameExists  = errors.New("username already exists")
	ErrStudentIdExists = errors.New("student id already exists")
)

type UserRepository interface {
	FindByEmail(email string) (*models.User, error)
	FindByUsername(username string) (*models.User, error)
	FindByStudentId(studentId string) (*models.User, error)
	FindByID(id uint) (*models.User, error)
	Create(user *models.User) (*models.User, error)
	Update(user *models.User, cols ...string) (*models.User, error)
	FollowUser(follower *models.User, following *models.User) error
	UnfollowUser(follower *models.User, following *models.User) error
	LoadFollowers(user *models.User) error
	CountUsers() (int64, error)
	FindAll() ([]models.User, error)
	GetDB() *gorm.DB
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func normalizeEmail(e string) string {
	return strings.ToLower(strings.TrimSpace(e))
}

func (r *userRepository) FindByEmail(email string) (*models.User, error) {
	email = normalizeEmail(email)
	var u models.User
	err := r.db.Where("email = ?", email).First(&u).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) FindByUsername(username string) (*models.User, error) {
	username = strings.TrimSpace(username)
	var u models.User
	err := r.db.Where("username = ?", username).First(&u).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) FindByStudentId(studentId string) (*models.User, error) {
	var u models.User
	err := r.db.Where("student_id = ?", studentId).First(&u).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) FindByID(id uint) (*models.User, error) {
	var u models.User
	err := r.db.First(&u, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) Create(user *models.User) (*models.User, error) {
	if err := r.db.Create(user).Error; err != nil {
		// 判重（这里只演示 MySQL 通用字符串判断，可按驱动错误码更精细化）
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") ||
			strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, ErrEmailExists // 若需细分 email/username 可进一步判断字段
		}
		return nil, err
	}
	return user, nil
}

func (r *userRepository) Update(user *models.User, cols ...string) (*models.User, error) {
	tx := r.db.Model(user)
	if len(cols) > 0 {
		tx = tx.Select(cols)
	}
	if err := tx.Updates(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepository) FollowUser(follower *models.User, following *models.User) error {
	return r.db.Model(follower).Association("Following").Append(following)
}

func (r *userRepository) UnfollowUser(follower *models.User, following *models.User) error {
	return r.db.Model(follower).Association("Following").Delete(following)
}

func (r *userRepository) LoadFollowers(user *models.User) error {
	return r.db.Model(user).Association("Followers").Find(&user.Followers)
}

// CountUsers 计算用户总数
func (r *userRepository) CountUsers() (int64, error) {
	var count int64
	err := r.db.Model(&models.User{}).Count(&count).Error
	return count, err
}

// FindAll 获取所有用户
func (r *userRepository) FindAll() ([]models.User, error) {
	var users []models.User

	// 使用Debug()来记录SQL查询
	result := r.db.Debug().Find(&users)

	// 记录查询结果
	log.Printf("FindAll: 找到 %d 个用户, 错误: %v", len(users), result.Error)

	// 如果结果为空但没有错误，记录一条消息
	if len(users) == 0 && result.Error == nil {
		log.Printf("FindAll: 警告 - 数据库中可能没有用户记录")
	}

	return users, result.Error
}

// GetDB 返回数据库连接以供调试
func (r *userRepository) GetDB() *gorm.DB {
	return r.db
}
