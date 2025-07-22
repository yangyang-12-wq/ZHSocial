package repositories

import (
	"nhcommunity/models"

	"gorm.io/gorm"
)

type ChatRepository interface {
	GetConversationsByUserID(userID uint) ([]models.Conversation, error)
	GetConversationByID(conversationID uint) (*models.Conversation, error)
	FindConversationBetweenUsers(userID1, userID2 uint) (*models.Conversation, error)
	CreateConversation(conversation *models.Conversation) (*models.Conversation, error)
	GetMessagesByConversationID(conversationID uint, limit, offset int) ([]models.Message, error)
	CreateMessage(message *models.Message) (*models.Message, error)
	UpdateConversation(conversation *models.Conversation) error
}

type chatRepository struct {
	db *gorm.DB
}

func NewChatRepository(db *gorm.DB) ChatRepository {
	return &chatRepository{db: db}
}

func (r *chatRepository) GetConversationsByUserID(userID uint) ([]models.Conversation, error) {
	var conversations []models.Conversation
	err := r.db.
		Preload("Participants").
		Preload("LastMessage.Sender").
		Joins("JOIN conversation_participants cp ON cp.conversation_id = conversations.id").
		Where("cp.user_id = ?", userID).
		Order("conversations.updated_at desc").
		Find(&conversations).Error
	return conversations, err
}

func (r *chatRepository) GetConversationByID(conversationID uint) (*models.Conversation, error) {
	var conversation models.Conversation
	err := r.db.Preload("Participants").First(&conversation, conversationID).Error
	return &conversation, err
}

// FindConversationBetweenUsers finds a direct message conversation between two users
func (r *chatRepository) FindConversationBetweenUsers(userID1, userID2 uint) (*models.Conversation, error) {
	var conversation models.Conversation
	// This query is complex. It finds a conversation that has EXACTLY two participants,
	// and those participants are userID1 and userID2.
	err := r.db.
		Joins("JOIN conversation_participants cp1 ON cp1.conversation_id = conversations.id AND cp1.user_id = ?", userID1).
		Joins("JOIN conversation_participants cp2 ON cp2.conversation_id = conversations.id AND cp2.user_id = ?", userID2).
		Joins("LEFT JOIN conversation_participants cp_other ON cp_other.conversation_id = conversations.id AND cp_other.user_id NOT IN (?, ?)", userID1, userID2).
		Where("cp_other.user_id IS NULL").
		First(&conversation).Error

	if err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (r *chatRepository) CreateConversation(conversation *models.Conversation) (*models.Conversation, error) {
	err := r.db.Create(conversation).Error
	return conversation, err
}

func (r *chatRepository) GetMessagesByConversationID(conversationID uint, limit, offset int) ([]models.Message, error) {
	var messages []models.Message
	err := r.db.
		Where("conversation_id = ?", conversationID).
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&messages).Error
	return messages, err
}

func (r *chatRepository) CreateMessage(message *models.Message) (*models.Message, error) {
	err := r.db.Create(message).Error
	if err != nil {
		return nil, err
	}
	// Also update the conversation's last message and updated_at time
	err = r.db.Model(&models.Conversation{}).Where("id = ?", message.ConversationID).Updates(map[string]interface{}{
		"last_message_id": message.ID,
		"updated_at":      message.CreatedAt,
	}).Error

	return message, err
}

func (r *chatRepository) UpdateConversation(conversation *models.Conversation) error {
	return r.db.Save(conversation).Error
}
