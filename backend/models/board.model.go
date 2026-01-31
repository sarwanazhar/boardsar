package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Board represents the complete board state as stored in MongoDB
// This matches the frontend Board interface exactly
type Board struct {
	ID        primitive.ObjectID     `json:"_id" bson:"_id,omitempty"`
	BoardID   string                 `json:"boardId" bson:"boardId"` // Unique board identifier
	OwnerID   primitive.ObjectID     `json:"ownerId" bson:"ownerId"` // User who owns this board
	BoardData map[string]interface{} `json:"board" bson:"board"`     // Raw frontend board state
	CreatedAt time.Time              `json:"createdAt" bson:"createdAt"`
	UpdatedAt time.Time              `json:"updatedAt" bson:"updatedAt"`
}

// FrontendBoard represents the board structure expected by the frontend
type FrontendBoard struct {
	ID         string                   `json:"_id"`
	Name       string                   `json:"name"`
	OwnerID    string                   `json:"ownerId"`
	SharedWith []string                 `json:"sharedWith"`
	CreatedAt  time.Time                `json:"createdAt"`
	UpdatedAt  time.Time                `json:"updatedAt"`
	Scale      float64                  `json:"scale"`
	Position   map[string]float64       `json:"position"`
	Shapes     []map[string]interface{} `json:"shapes"`
}

// BoardRequest represents the request structure for creating/updating boards
type BoardRequest struct {
	BoardID string                 `json:"boardId" bson:"boardId"`
	Board   map[string]interface{} `json:"board" binding:"required"`
}

// BoardResponse represents the response structure for board operations
type BoardResponse struct {
	ID        primitive.ObjectID     `json:"_id"`
	BoardID   string                 `json:"boardId"`
	OwnerID   primitive.ObjectID     `json:"ownerId"`
	Board     map[string]interface{} `json:"board"`
	CreatedAt time.Time              `json:"createdAt"`
	UpdatedAt time.Time              `json:"updatedAt"`
}
