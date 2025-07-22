package services

import (
	"errors"
	"nhcommunity/models"
	"nhcommunity/repositories"
)

// PostService defines the interface for post business logic
type PostService interface {
	GetPosts(limit, offset int) ([]models.PostResponse, error)
	GetPostByID(id, currentUserID uint) (*models.PostResponse, error)
	CreatePost(req *models.CreatePostRequest, userID uint) (*models.PostResponse, error)
	UpdatePost(id, userID uint, req *models.UpdatePostRequest, userRole string) (*models.PostResponse, error)
	DeletePost(id, userID uint, userRole string) error

	LikePost(postID, userID uint) error
	UnlikePost(postID, userID uint) error

	CreateComment(postID, userID uint, content string) (*models.CommentResponse, error)
	UpdateComment(commentID, userID uint, content string) (*models.CommentResponse, error)
	DeleteComment(commentID, userID uint, userRole string) error
	SearchPosts(keyword string, page, limit int, sort string) ([]models.Post, int64, error)
}

type postService struct {
	repo repositories.PostRepository
}

// NewPostService creates a new instance of PostService
func NewPostService(repo repositories.PostRepository) PostService {
	return &postService{repo: repo}
}

func (s *postService) GetPosts(limit, offset int) ([]models.PostResponse, error) {
	posts, err := s.repo.FindAll(limit, offset)
	if err != nil {
		return nil, err
	}
	var responses []models.PostResponse
	for _, p := range posts {
		responses = append(responses, p.ToResponse(0)) // User not logged in
	}
	return responses, nil
}

func (s *postService) GetPostByID(id, currentUserID uint) (*models.PostResponse, error) {
	post, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	response := post.ToResponse(currentUserID)
	return &response, nil
}

func (s *postService) CreatePost(req *models.CreatePostRequest, userID uint) (*models.PostResponse, error) {
	post := &models.Post{
		UserID:  userID,
		Title:   req.Title,
		Content: req.Content,
	}
	newPost, err := s.repo.Create(post)
	if err != nil {
		return nil, err
	}
	response := newPost.ToResponse(userID)
	return &response, nil
}

func (s *postService) UpdatePost(id, userID uint, req *models.UpdatePostRequest, userRole string) (*models.PostResponse, error) {
	post, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if post.UserID != userID && userRole != "admin" {
		return nil, errors.New("permission denied")
	}
	if req.Title != "" {
		post.Title = req.Title
	}
	if req.Content != "" {
		post.Content = req.Content
	}
	updatedPost, err := s.repo.Update(post)
	if err != nil {
		return nil, err
	}
	response := updatedPost.ToResponse(userID)
	return &response, nil
}

func (s *postService) DeletePost(id, userID uint, userRole string) error {
	post, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if post.UserID != userID && userRole != "admin" {
		return errors.New("permission denied")
	}
	return s.repo.Delete(post)
}

func (s *postService) LikePost(postID, userID uint) error {
	_, err := s.repo.FindLike(userID, postID)
	if err == nil {
		return errors.New("already liked")
	}
	like := &models.Like{
		UserID: userID,
		PostID: postID,
	}
	return s.repo.CreateLike(like)
}

func (s *postService) UnlikePost(postID, userID uint) error {
	return s.repo.DeleteLike(userID, postID)
}

func (s *postService) CreateComment(postID, userID uint, content string) (*models.CommentResponse, error) {
	comment := &models.Comment{
		PostID:  postID,
		UserID:  userID,
		Content: content,
	}
	newComment, err := s.repo.CreateComment(comment)
	if err != nil {
		return nil, err
	}
	// Manually load post and user for response
	loadedPost, err := s.repo.FindByID(postID)
	if err != nil {
		return nil, err
	}
	newComment.Post = *loadedPost
	response := newComment.ToResponse()
	return &response, nil
}

func (s *postService) UpdateComment(commentID, userID uint, content string) (*models.CommentResponse, error) {
	comment, err := s.repo.FindCommentByID(commentID)
	if err != nil {
		return nil, err
	}
	if comment.UserID != userID {
		return nil, errors.New("permission denied")
	}
	comment.Content = content
	updatedComment, err := s.repo.UpdateComment(comment)
	if err != nil {
		return nil, err
	}
	response := updatedComment.ToResponse()
	return &response, nil
}

func (s *postService) DeleteComment(commentID, userID uint, userRole string) error {
	comment, err := s.repo.FindCommentByID(commentID)
	if err != nil {
		return err
	}
	if comment.UserID != userID && userRole != "admin" {
		return errors.New("permission denied")
	}
	return s.repo.DeleteComment(comment)
}

func (s *postService) SearchPosts(keyword string, page, limit int, sort string) ([]models.Post, int64, error) {
	return s.repo.SearchPosts(keyword, page, limit, sort)
}
