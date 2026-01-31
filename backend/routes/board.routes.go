package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sarwanazhar/boardsar/backend/controllers"
	"github.com/sarwanazhar/boardsar/backend/libs"
)

func InitBoardRoutes(router *gin.Engine) {
	// Protected board routes
	board := router.Group("/api/boards")
	board.Use(libs.JWTMiddleware())
	{
		// List all boards for the authenticated user
		board.GET("", controllers.GetBoards)

		// Create a new board
		board.POST("", controllers.CreateBoard)

		// Get a specific board by ID
		board.GET("/:boardId", controllers.GetBoard)

		// Update an existing board
		board.PUT("/:boardId", controllers.UpdateBoard)

		// Delete a board
		board.DELETE("/:boardId", controllers.DeleteBoard)
	}
}
