package libs

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string

		// 1️⃣ Try Authorization header first
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			// Extract token after "Bearer "
			tokenString = strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		} else {
			// 2️⃣ Fallback: try cookie
			cookieToken, err := c.Cookie("token")
			if err == nil && cookieToken != "" {
				tokenString = cookieToken
			}
		}

		// If still empty → unauthorized
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token missing"})
			c.Abort()
			return
		}

		// Parse and verify token
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrTokenSignatureInvalid
			}
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || claims["userId"] == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		userID, ok := claims["userId"].(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token userId"})
			c.Abort()
			return
		}

		// Save userId in context for handlers like GetProfile
		c.Set("userId", userID)
		c.Next()
	}
}
