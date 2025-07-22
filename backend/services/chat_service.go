package services

import (
	"errors"
	"log"
	"net/http"
	"nhcommunity/models"
	"nhcommunity/repositories"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// CheckOrigin allows us to accept requests from any origin.
	// In a production environment, you should implement a proper CORS policy.
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type ChatService interface {
	ServeWs(hub *Hub, c *gin.Context)
	GetConversations(userID uint) ([]models.Conversation, error)
	GetMessages(conversationID uint, limit, offset int) ([]models.Message, error)
	GetOrCreateConversation(userID1, userID2 uint) (*models.Conversation, error)
	CreateMessage(message *models.Message) (*models.Message, error)
}

type chatService struct {
	db   *gorm.DB
	repo repositories.ChatRepository
}

func NewChatService(db *gorm.DB, repo repositories.ChatRepository) ChatService {
	return &chatService{
		db:   db,
		repo: repo,
	}
}

// ServeWs handles websocket requests from the peer.
func (s *chatService) ServeWs(hub *Hub, c *gin.Context) {
	// Upgrade the HTTP server connection to a WebSocket connection.
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	// Get user ID from the context (set by the auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		log.Println("Unauthorized WebSocket connection attempt.")
		conn.WriteMessage(websocket.CloseMessage, []byte("Unauthorized"))
		conn.Close()
		return
	}

	// In a real app, you would also fetch user details from the database.
	// For now, we just use the user ID.
	uid, ok := userID.(uint)
	if !ok {
		log.Printf("Invalid user ID type in context: %T", userID)
		conn.Close()
		return
	}

	// Create a new client for this user.
	client := &Client{
		hub:     hub,
		conn:    conn,
		send:    make(chan *models.WebsocketMessage, 256),
		userID:  uid,
		service: s,
	}

	// Register the new client with the hub.
	client.hub.register <- client

	// Allow collection of memory referenced by the go routines.
	go client.writePump()
	go client.readPump()

	log.Printf("WebSocket connection established for UserID: %d", uid)
}

func (s *chatService) GetConversations(userID uint) ([]models.Conversation, error) {
	return s.repo.GetConversationsByUserID(userID)
}

func (s *chatService) GetMessages(conversationID uint, limit, offset int) ([]models.Message, error) {
	return s.repo.GetMessagesByConversationID(conversationID, limit, offset)
}

func (s *chatService) GetOrCreateConversation(userID1, userID2 uint) (*models.Conversation, error) {
	convo, err := s.repo.FindConversationBetweenUsers(userID1, userID2)
	if err == nil && convo != nil {
		return convo, nil // Found existing conversation
	}

	// If not found, create a new one
	if errors.Is(err, gorm.ErrRecordNotFound) || convo == nil {
		newConvo := &models.Conversation{
			Participants: []models.User{{ID: userID1}, {ID: userID2}},
		}
		return s.repo.CreateConversation(newConvo)
	}

	return nil, err // Other database error
}

func (s *chatService) CreateMessage(message *models.Message) (*models.Message, error) {
	return s.repo.CreateMessage(message)
}
