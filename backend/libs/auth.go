package libs

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sarwanazhar/boardsar/backend/database"
	"github.com/sarwanazhar/boardsar/backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

const dbName = "boardsar"
const userCollection = "users"

func getUserCollection() *mongo.Collection {
	return database.GetCollection(dbName, userCollection)
}

func CreateUser(ctx context.Context, user *models.User) (primitive.ObjectID, error) {
	user.ID = primitive.NewObjectID()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	_, err := getUserCollection().InsertOne(ctx, user)
	return user.ID, err
}

func SearchForExistingEmail(email string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.D{
		bson.E{Key: "email", Value: email},
	}

	var user models.User

	err := database.GetCollection(dbName, userCollection).FindOne(ctx, filter).Decode(&user)

	switch err {
	case nil:
		return true, nil
	case mongo.ErrNoDocuments:
		return false, nil
	default:
		return false, fmt.Errorf("database error during email search: %w", err)
	}
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func FindUserByEmail(email string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"email": email}

	var user models.User

	result := database.GetCollection(dbName, userCollection).FindOne(ctx, filter)

	if result.Err() != nil {
		if result.Err() == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("user with email '%s' not found", email)
		}
		return nil, fmt.Errorf("error finding user: %w", result.Err())
	}

	err := result.Decode(&user)
	if err != nil {
		return nil, fmt.Errorf("error decoding user document: %w", err)
	}

	return &user, nil
}

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

func GenerateJWT(userID string) (string, error) {
	claims := jwt.MapClaims{
		"userId": userID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString(jwtSecret)
}

func FindUserByID(id string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid user id format")
	}

	filter := bson.M{"_id": objID}

	var user models.User
	result := getUserCollection().FindOne(ctx, filter)
	if result.Err() != nil {
		if result.Err() == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("user with id '%s' not found", id)
		}
		return nil, fmt.Errorf("error finding user: %w", result.Err())
	}

	if err := result.Decode(&user); err != nil {
		return nil, fmt.Errorf("error decoding user document: %w", err)
	}

	return &user, nil
}
