package controllers

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sarwanazhar/boardsar/backend/database"
	"github.com/sarwanazhar/boardsar/backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// transformBoardToFrontend converts a backend Board to the frontend format
func transformBoardToFrontend(board *models.Board) models.FrontendBoard {
	// Return the board data as-is since it's already in the correct frontend format
	// The board.BoardData contains the complete frontend board state
	return models.FrontendBoard{
		ID:         board.ID.Hex(),
		Name:       board.BoardID,
		OwnerID:    board.OwnerID.Hex(),
		SharedWith: []string{}, // Backend doesn't store sharedWith in this model
		CreatedAt:  board.CreatedAt,
		UpdatedAt:  board.UpdatedAt,
		Scale:      1.0, // Default scale
		Position: map[string]float64{
			"x": 0,
			"y": 0,
		},
		Shapes: []map[string]interface{}{}, // This field is not used by the frontend
	}
}

const dbName = "boardsar"
const boardCollection = "boards"

func getBoardCollection() *mongo.Collection {
	return database.GetCollection(dbName, boardCollection)
}

// CreateBoard creates a new board for the authenticated user
func CreateBoard(c *gin.Context) {
	var req models.BoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Get user ID from JWT context
	userIDStr := c.GetString("userId")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Generate board ID if not provided
	boardID := req.BoardID
	if boardID == "" {
		boardID = uuid.New().String()
	}

	// Create new board
	board := models.Board{
		ID:        primitive.NewObjectID(),
		BoardID:   boardID,
		OwnerID:   userID,
		BoardData: req.Board,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = getBoardCollection().InsertOne(ctx, board)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create board: " + err.Error(),
		})
		return
	}

	// Return the complete board data including the frontend state
	c.JSON(http.StatusCreated, gin.H{
		"message": "Board created successfully",
		"board":   board.BoardData,
	})
}

// UpdateBoard updates the entire board state
func UpdateBoard(c *gin.Context) {
	boardIDStr := c.Param("boardId")
	if boardIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Board ID is required",
		})
		return
	}

	// Get user ID from JWT context
	userIDStr := c.GetString("userId")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	var req models.BoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Try to parse the board ID as an ObjectID first (for MongoDB ObjectID format)
	boardObjectID, err := primitive.ObjectIDFromHex(boardIDStr)
	var board models.Board
	var boardFilter bson.M

	if err == nil {
		// Board ID is a valid ObjectID, search by _id
		boardFilter = bson.M{
			"_id":     boardObjectID,
			"ownerId": userID,
		}
	} else {
		// If not a valid ObjectID, try searching by boardId field (for string board IDs)
		boardFilter = bson.M{
			"boardId": boardIDStr,
			"ownerId": userID,
		}
	}

	// Find the board and check ownership
	err = getBoardCollection().FindOne(ctx, boardFilter).Decode(&board)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Board not found or access denied",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve board: " + err.Error(),
		})
		return
	}

	// Update the board with the entire new state
	update := bson.M{
		"$set": bson.M{
			"board":     req.Board,
			"updatedAt": time.Now(),
		},
	}

	_, err = getBoardCollection().UpdateOne(ctx, boardFilter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update board: " + err.Error(),
		})
		return
	}

	// Return updated board
	var updatedBoard models.Board
	err = getBoardCollection().FindOne(ctx, boardFilter).Decode(&updatedBoard)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve updated board: " + err.Error(),
		})
		return
	}

	// Return the complete board data including the frontend state
	c.JSON(http.StatusOK, gin.H{
		"message": "Board updated successfully",
		"board":   updatedBoard.BoardData,
	})
}

// GetBoard retrieves a specific board by ID
func GetBoard(c *gin.Context) {
	boardIDStr := c.Param("boardId")
	if boardIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Board ID is required",
		})
		return
	}

	// Get user ID from JWT context
	userIDStr := c.GetString("userId")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Debug: Log the search parameters
	log.Printf("🔍 Searching for board: %s, owner: %s", boardIDStr, userIDStr)

	// Check if user exists first
	var user models.User
	err = database.GetCollection("boardsar", "users").FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		log.Printf("❌ User not found: %v", err)
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}
	log.Printf("✅ User found: %s", user.Email)

	// Try to parse the board ID as an ObjectID first (for MongoDB ObjectID format)
	boardObjectID, err := primitive.ObjectIDFromHex(boardIDStr)
	if err == nil {
		// Board ID is a valid ObjectID, search by _id
		log.Printf("🔍 Searching by ObjectID: %s", boardObjectID.Hex())
		var board models.Board
		err = getBoardCollection().FindOne(ctx, bson.M{
			"_id":     boardObjectID,
			"ownerId": userID,
		}).Decode(&board)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				// Debug: Check what boards this user actually has
				var userBoards []models.Board
				cursor, err := getBoardCollection().Find(ctx, bson.M{"ownerId": userID})
				if err == nil {
					cursor.All(ctx, &userBoards)
					log.Printf("📋 User has %d boards: %v", len(userBoards), userBoards)
				}

				c.JSON(http.StatusNotFound, gin.H{
					"error": "Board not found or access denied",
					"debug": gin.H{
						"requestedBoardId": boardIDStr,
						"userId":           userIDStr,
						"userBoardsCount":  len(userBoards),
						"searchMethod":     "ObjectID",
					},
				})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to retrieve board: " + err.Error(),
			})
			return
		}

		// Return the complete board data including the frontend state
		c.JSON(http.StatusOK, gin.H{
			"board": board.BoardData,
		})
		return
	}

	// If not a valid ObjectID, try searching by boardId field (for string board IDs)
	log.Printf("🔍 Searching by boardId field: %s", boardIDStr)
	var board models.Board
	err = getBoardCollection().FindOne(ctx, bson.M{
		"boardId": boardIDStr,
		"ownerId": userID,
	}).Decode(&board)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Debug: Check what boards this user actually has
			var userBoards []models.Board
			cursor, err := getBoardCollection().Find(ctx, bson.M{"ownerId": userID})
			if err == nil {
				cursor.All(ctx, &userBoards)
				log.Printf("📋 User has %d boards: %v", len(userBoards), userBoards)
			}

			c.JSON(http.StatusNotFound, gin.H{
				"error": "Board not found or access denied",
				"debug": gin.H{
					"requestedBoardId": boardIDStr,
					"userId":           userIDStr,
					"userBoardsCount":  len(userBoards),
					"searchMethod":     "boardId",
				},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve board: " + err.Error(),
		})
		return
	}

	// Return the complete board data including the frontend state
	c.JSON(http.StatusOK, gin.H{
		"board": board.BoardData,
	})
}

// GetBoards retrieves all boards available to the authenticated user
func GetBoards(c *gin.Context) {
	// Get user ID from JWT context
	userIDStr := c.GetString("userId")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Find boards where user is owner
	filter := bson.M{
		"ownerId": userID,
	}

	cursor, err := getBoardCollection().Find(ctx, filter, options.Find().SetSort(bson.M{"updatedAt": -1}))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve boards: " + err.Error(),
		})
		return
	}
	defer cursor.Close(ctx)

	var boards []models.Board
	if err = cursor.All(ctx, &boards); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to decode boards: " + err.Error(),
		})
		return
	}

	// Convert to frontend format
	var frontendBoards []models.FrontendBoard
	for _, board := range boards {
		frontendBoards = append(frontendBoards, transformBoardToFrontend(&board))
	}

	c.JSON(http.StatusOK, gin.H{
		"boards": frontendBoards,
	})
}

// DeleteBoard deletes a board for the authenticated user
func DeleteBoard(c *gin.Context) {
	userIDStr := c.GetString("userId")
	boardIDStr := c.Param("boardId")

	// Validate board ID
	if boardIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Board ID is required"})
		return
	}

	// Get user ID as ObjectID
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Try to parse the board ID as an ObjectID first (for MongoDB ObjectID format)
	boardObjectID, err := primitive.ObjectIDFromHex(boardIDStr)
	var boardFilter bson.M

	if err == nil {
		// Board ID is a valid ObjectID, search by _id
		boardFilter = bson.M{
			"_id":     boardObjectID,
			"ownerId": userID,
		}
	} else {
		// If not a valid ObjectID, try searching by boardId field (for string board IDs)
		boardFilter = bson.M{
			"boardId": boardIDStr,
			"ownerId": userID,
		}
	}

	// Find the board to ensure it exists and belongs to the user
	var board models.Board
	err = getBoardCollection().FindOne(ctx, boardFilter).Decode(&board)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Board not found or access denied"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find board"})
		return
	}

	// Delete the board
	_, err = getBoardCollection().DeleteOne(ctx, boardFilter)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete board"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Board deleted successfully",
		"boardId": boardIDStr,
	})
}
