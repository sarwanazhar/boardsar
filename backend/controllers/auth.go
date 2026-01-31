package controllers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sarwanazhar/boardsar/backend/libs"
	"github.com/sarwanazhar/boardsar/backend/models"
)

func RegisterUser(c *gin.Context) {
	type Body struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	var body Body
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	EmailExists, err := libs.SearchForExistingEmail(body.Email)

	if err != nil {
		log.Printf("Failed to check email existence for %s: %v", body.Email, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error. Please try again later."})
		return
	}

	if EmailExists {
		c.JSON(http.StatusConflict, gin.H{"error": "This email address is already registered."})
		return
	}

	hashedPassword, err := libs.HashPassword(body.Password)

	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	user := &models.User{
		Email:    body.Email,
		Password: hashedPassword,
	}

	newId, err := libs.CreateUser(ctx, user)
	if err != nil {
		log.Printf("Failed to create user %s: %v", body.Email, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error. Please try again later."})
		return
	}

	fmt.Print("new user created id:")
	fmt.Println(newId)

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully"})
}

func LoginUser(c *gin.Context) {
	type Body struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	var body Body
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	foundUser, err := libs.FindUserByEmail(body.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	isPasswordCorrect := libs.CheckPasswordHash(body.Password, foundUser.Password)

	if !isPasswordCorrect {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := libs.GenerateJWT(foundUser.ID.Hex())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Could not generate token",
		})
		return
	}

	// Set cookie:
	c.Header("Set-Cookie",
		"token="+token+
			"; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=None")

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    foundUser.ID.Hex(),
			"email": foundUser.Email,
		},
	})
}

func GetProfile(c *gin.Context) {
	userID := c.GetString("userId")

	user, err := libs.FindUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID.Hex(),
		"email": user.Email,
	})
}
