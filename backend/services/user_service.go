package services

import (
	"errors"
	"log"
	"nhcommunity/models"
	"nhcommunity/repositories"
	"nhcommunity/utils"
	"strings"

	"gorm.io/gorm"
)

// UserService defines the interface for user business logic
type UserService interface {
	Register(user *models.User) (*models.User, error)
	Login(email, password string) (*models.User, string, string, error)
	RefreshToken(refreshToken string) (string, error)
	GetUserByID(id, currentUserID uint) (*models.UserResponse, error)
	GetUserByUsername(username string) (*models.User, error)
	UpdateCurrentUser(id uint, req *models.UpdateUserRequest) (*models.UserResponse, error)
	Follow(followerID, followingID uint) error
	Unfollow(followerID, followingID uint) error
	GetAllUsers() ([]models.User, error)
	UpdateUserStatus(userId uint, isActive bool) error
	UpdateUserRole(userId uint, role string, adminId uint) error
	GetDB() *gorm.DB
}

type userService struct {
	userRepo repositories.UserRepository
}

// NewUserService creates a new instance of UserService
func NewUserService(userRepo repositories.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) GetUserByID(id uint, currentUserID uint) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}
	// We need to load the followers to check if the current user is following
	// This might be inefficient and could be optimized later.
	s.userRepo.LoadFollowers(user)

	response := user.ToResponse(currentUserID)
	return &response, nil
}

func (s *userService) UpdateCurrentUser(id uint, req *models.UpdateUserRequest) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if req.FullName != "" {
		user.FullName = req.FullName
	}
	if req.AvatarURL != "" {
		user.AvatarURL = req.AvatarURL
	}
	if req.Bio != "" {
		user.Bio = req.Bio
	}
	if req.Password != "" {
		user.Password = req.Password
		if err := user.HashPassword(); err != nil {
			return nil, errors.New("failed to hash password")
		}
	}

	updatedUser, err := s.userRepo.Update(user)
	if err != nil {
		return nil, errors.New("failed to update user")
	}

	response := updatedUser.ToResponse()
	return &response, nil
}

func (s *userService) Register(user *models.User) (*models.User, error) {
	// Check if email is already registered
	_, err := s.userRepo.FindByEmail(strings.ToLower(user.Email))
	if err == nil {
		return nil, repositories.ErrEmailExists
	}
	if !errors.Is(err, repositories.ErrUserNotFound) {
		// A different error occurred, so we should probably stop.
		return nil, err
	}

	// Check if username is already taken
	_, err = s.userRepo.FindByUsername(user.Username)
	if err == nil {
		return nil, repositories.ErrUsernameExists
	}
	if !errors.Is(err, repositories.ErrUserNotFound) {
		// A different error occurred
		return nil, err
	}

	// Check if student id is already taken if provided
	if user.StudentId != "" {
		_, err = s.userRepo.FindByStudentId(user.StudentId)
		if err == nil {
			return nil, repositories.ErrStudentIdExists
		}
		if !errors.Is(err, repositories.ErrUserNotFound) {
			// A different error occurred
			return nil, err
		}
	}

	// Hash the password
	if err := user.HashPassword(); err != nil {
		return nil, err
	}

	// Create the user
	return s.userRepo.Create(user)
}

func (s *userService) Login(email, password string) (*models.User, string, string, error) {
	// Normalize email
	email = strings.ToLower(strings.TrimSpace(email))

	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			return nil, "", "", errors.New("invalid credentials")
		}
		return nil, "", "", err
	}

	// Check if the password is correct
	if err := user.CheckPassword(password); err != nil {
		return nil, "", "", errors.New("invalid credentials")
	}

	// Generate tokens
	accessToken, err := utils.GenerateAccessToken(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	// Save refresh token to database
	user.RefreshToken = refreshToken
	_, err = s.userRepo.Update(user)
	if err != nil {
		return nil, "", "", err
	}

	return user, accessToken, refreshToken, nil
}

func (s *userService) Follow(followerID, followingID uint) error {
	if followerID == followingID {
		return errors.New("cannot follow yourself")
	}

	follower, err := s.userRepo.FindByID(followerID)
	if err != nil {
		return errors.New("follower not found")
	}

	following, err := s.userRepo.FindByID(followingID)
	if err != nil {
		return errors.New("user to follow not found")
	}

	return s.userRepo.FollowUser(follower, following)
}

func (s *userService) Unfollow(followerID, followingID uint) error {
	if followerID == followingID {
		return errors.New("cannot unfollow yourself")
	}

	follower, err := s.userRepo.FindByID(followerID)
	if err != nil {
		return errors.New("follower not found")
	}

	following, err := s.userRepo.FindByID(followingID)
	if err != nil {
		return errors.New("user to unfollow not found")
	}

	return s.userRepo.UnfollowUser(follower, following)
}

// GetAllUsers 获取所有用户
func (s *userService) GetAllUsers() ([]models.User, error) {
	log.Println("UserService: 开始获取所有用户")

	users, err := s.userRepo.FindAll()
	if err != nil {
		log.Printf("UserService: 获取所有用户失败: %v", err)
		return nil, err
	}

	log.Printf("UserService: 成功获取 %d 个用户", len(users))

	// 如果是空数据，再次查询确认
	if len(users) == 0 {
		count, _ := s.userRepo.CountUsers()
		log.Printf("UserService: 用户总数: %d", count)
	}

	return users, nil
}

// UpdateUserStatus 更新用户状态（启用/禁用）
func (s *userService) UpdateUserStatus(userId uint, isActive bool) error {
	user, err := s.userRepo.FindByID(userId)
	if err != nil {
		return err
	}

	user.IsActive = isActive
	_, err = s.userRepo.Update(user, "is_active")
	return err
}

// UpdateUserRole 更新用户角色
func (s *userService) UpdateUserRole(userId uint, role string, adminId uint) error {
	user, err := s.userRepo.FindByID(userId)
	if err != nil {
		return err
	}

	// 检查是否有效的角色
	validRoles := map[string]bool{
		"user":      true,
		"moderator": true,
		"admin":     true,
	}

	if !validRoles[role] {
		return errors.New("无效的角色值")
	}

	// 不允许最后一个管理员降级自己
	if userId == adminId && user.Role == "admin" && role != "admin" {
		// TODO: 检查是否还有其他管理员
	}

	user.Role = role
	_, err = s.userRepo.Update(user, "role")
	return err
}

// RefreshToken 使用刷新令牌获取新的访问令牌
func (s *userService) RefreshToken(refreshToken string) (string, error) {
	// 验证刷新令牌
	userId, err := utils.ValidateRefreshToken(refreshToken)
	if err != nil {
		return "", errors.New("invalid refresh token")
	}

	// 获取用户
	user, err := s.userRepo.FindByID(userId)
	if err != nil {
		return "", errors.New("user not found")
	}

	// 验证令牌与数据库中存储的是否匹配
	if user.RefreshToken != refreshToken {
		return "", errors.New("refresh token mismatch")
	}

	// 生成新的访问令牌
	accessToken, err := utils.GenerateAccessToken(user.ID)
	if err != nil {
		return "", err
	}

	return accessToken, nil
}

// GetUserByUsername 通过用户名获取用户
func (s *userService) GetUserByUsername(username string) (*models.User, error) {
	return s.userRepo.FindByUsername(username)
}

// GetDB 返回数据库连接以供调试
func (s *userService) GetDB() *gorm.DB {
	return s.userRepo.GetDB()
}
