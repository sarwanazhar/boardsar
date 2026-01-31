package database

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client

func ConnectMongo(uri string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal("Mongo connect error:", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		log.Fatal("Mongo ping error:", err)
	}

	Client = client
	log.Println("✅ MongoDB connected")

	// Create indexes after successful connection
	CreateBoardIndexes()
}

// InitializeMockClient creates a mock client to prevent nil pointer dereference
func InitializeMockClient() {
	Client = &mongo.Client{}
}

func GetDatabase(dbName string) *mongo.Database {
	return Client.Database(dbName)
}

func GetCollection(dbName, collectionName string) *mongo.Collection {
	return Client.Database(dbName).Collection(collectionName)
}

// CreateBoardIndexes creates necessary indexes for the boards collection
func CreateBoardIndexes() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Create indexes on boards collection
	boardsCollection := Client.Database("boardsar").Collection("boards")

	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{"ownerId", 1}},
		},
		{
			Keys: bson.D{{"updatedAt", -1}},
		},
	}

	_, err := boardsCollection.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		log.Printf("⚠️  Failed to create board indexes: %v", err)
	} else {
		log.Println("✅ Board indexes created successfully")
	}
}
