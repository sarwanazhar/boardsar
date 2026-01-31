package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sarwanazhar/boardsar/backend/controllers"
	"github.com/sarwanazhar/boardsar/backend/libs"
)

func InitRoutes(router *gin.Engine) {
	router.GET("/", func(ctx *gin.Context) {
		ctx.JSON(200, gin.H{
			"working": "working",
		})
	})

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// Public auth routes
	router.POST("/auth/register", controllers.RegisterUser)
	router.POST("/auth/login", controllers.LoginUser)

	// Protected routes
	auth := router.Group("/")
	auth.Use(libs.JWTMiddleware())
	{
		auth.GET("/me", controllers.GetProfile)
	}

	// Initialize board routes
	InitBoardRoutes(router)
}
