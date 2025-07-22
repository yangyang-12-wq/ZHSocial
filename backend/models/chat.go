package models

import (
	"time"
)

// Conversation represents a chat session between two or more users.
type Conversation struct {
	ID        uint      `gorm:"primaryKey;column:id" json:"id"`
	CreatedAt time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updatedAt"`

	// We can store participants in a separate join table
	Participants []User    `gorm:"many2many:conversation_participants;" json:"participants"`
	Messages     []Message `gorm:"-" json:"messages"` // Remove gorm relation tag to break circular dependency

	// For quick access to the last message
	LastMessageID *uint    `gorm:"column:last_message_id" json:"lastMessageId"`
	LastMessage   *Message `gorm:"-" json:"lastMessage"` // Remove gorm relation tag to break circular dependency
}

// TableName returns the database table name for the Conversation model.
func (Conversation) TableName() string {
	return "conversations"
}

// Message represents a single chat message in a conversation.
type Message struct {
	ID             uint      `gorm:"primaryKey;column:id" json:"id"`
	ConversationID uint      `gorm:"not null;index;column:conversation_id" json:"conversationId"`
	SenderID       uint      `gorm:"not null;index;column:sender_id" json:"senderId"`
	Content        string    `gorm:"type:text;not null;column:content" json:"content"`
	IsRead         bool      `gorm:"default:false;column:is_read" json:"isRead"`
	CreatedAt      time.Time `gorm:"autoCreateTime;column:created_at" json:"createdAt"`

	Sender User `gorm:"foreignKey:SenderID" json:"sender"`
}

// TableName returns the database table name for the Message model.
func (Message) TableName() string {
	return "messages"
}

// ConversationParticipant links users to conversations.
type ConversationParticipant struct {
	ConversationID uint      `gorm:"primaryKey;column:conversation_id" json:"conversationId"`
	UserID         uint      `gorm:"primaryKey;column:user_id" json:"userId"`
	JoinedAt       time.Time `gorm:"autoCreateTime;column:joined_at" json:"joinedAt"`
	// We could add roles here later (e.g., admin)
}

// TableName returns the database table name for the ConversationParticipant model.
func (ConversationParticipant) TableName() string {
	return "conversation_participants"
}

// --- WebSocket Message Structures (Not for DB) ---

// WebsocketMessage is the structure for messages sent over the WebSocket connection.
type WebsocketMessage struct {
	Type      string      `json:"type"` // e.g., "private_message", "typing_indicator", "error"
	Payload   interface{} `json:"payload"`
	Timestamp time.Time   `json:"timestamp"`
}

// PrivateMessagePayload is the payload for a 'private_message' type message.
type PrivateMessagePayload struct {
	RecipientID uint   `json:"recipientId"`
	Content     string `json:"content"`
}

// ToMessage converts the payload to a database Message model.
func (p *PrivateMessagePayload) ToMessage(senderID, conversationID uint) *Message {
	return &Message{
		ConversationID: conversationID,
		SenderID:       senderID,
		Content:        p.Content,
	}
}
