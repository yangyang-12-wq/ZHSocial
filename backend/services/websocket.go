package services

import (
	"encoding/json"
	"log"
	"nhcommunity/models"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 1024
)

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub *Hub

	// The websocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	send chan *models.WebsocketMessage

	// The user ID of the client.
	userID uint

	// The chat service.
	service ChatService
}

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	// We use a map of maps. The first key is the user ID.
	// The second key is the client pointer, allowing one user to have multiple connections.
	clients map[uint]map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan *models.WebsocketMessage

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	// Mutex to protect the clients map
	mu sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan *models.WebsocketMessage),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[uint]map[*Client]bool),
	}
}

// readPump pumps messages from the websocket connection to the hub.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// Unmarshal the message into our standard WebsocketMessage format
		var wsMsg models.WebsocketMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			log.Printf("error unmarshalling message: %v", err)
			continue
		}

		wsMsg.Timestamp = time.Now()

		if wsMsg.Type == "private_message" {
			var payload models.PrivateMessagePayload
			payloadBytes, _ := json.Marshal(wsMsg.Payload)
			if err := json.Unmarshal(payloadBytes, &payload); err != nil {
				log.Printf("error unmarshalling private message payload: %v", err)
				continue
			}

			convo, err := c.service.GetOrCreateConversation(c.userID, payload.RecipientID)
			if err != nil {
				log.Printf("error getting or creating conversation: %v", err)
				continue
			}

			dbMessage := payload.ToMessage(c.userID, convo.ID)
			savedMessage, err := c.service.CreateMessage(dbMessage)
			if err != nil {
				log.Printf("error saving message to db: %v", err)
				continue
			}

			responseMsg := models.WebsocketMessage{
				Type:      "incoming_private_message",
				Payload:   savedMessage,
				Timestamp: time.Now(),
			}

			c.hub.forwardPrivateMessage(&responseMsg, payload.RecipientID)
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			messageBytes, _ := json.Marshal(message)
			w.Write(messageBytes)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.clients[client.userID]; !ok {
				h.clients[client.userID] = make(map[*Client]bool)
			}
			h.clients[client.userID][client] = true
			log.Printf("Client connected: UserID %d", client.userID)
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if userClients, ok := h.clients[client.userID]; ok {
				if _, ok := userClients[client]; ok {
					delete(userClients, client)
					close(client.send)
					if len(userClients) == 0 {
						delete(h.clients, client.userID)
					}
					log.Printf("Client disconnected: UserID %d", client.userID)
				}
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			log.Printf("Hub received a broadcast message (currently no-op): %v", message)
		}
	}
}

// forwardPrivateMessage sends a message to a specific user.
func (h *Hub) forwardPrivateMessage(message *models.WebsocketMessage, recipientID uint) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if userClients, ok := h.clients[recipientID]; ok {
		for client := range userClients {
			select {
			case client.send <- message:
			default:
				close(client.send)
				delete(userClients, client)
				if len(userClients) == 0 {
					delete(h.clients, recipientID)
				}
			}
		}
		log.Printf("Forwarded message to UserID %d", recipientID)
	} else {
		log.Printf("Recipient UserID %d not found or not connected.", recipientID)
	}
} 