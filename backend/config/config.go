package config

import (
	"fmt"
	"log"
	"nhcommunity/models"
	"os"

	"github.com/spf13/viper"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Config struct for app configuration
type Config struct {
	DBHost         string `mapstructure:"DB_HOST"`
	DBPort         string `mapstructure:"DB_PORT"`
	DBUser         string `mapstructure:"DB_USER"`
	DBPassword     string `mapstructure:"DB_PASSWORD"`
	DBName         string `mapstructure:"DB_NAME"`
	JWTSecret      string `mapstructure:"JWT_SECRET"`
	ServerPort     string `mapstructure:"SERVER_PORT"`
	ClientOrigin   string `mapstructure:"CLIENT_ORIGIN"`
	TokenExpiresIn int    `mapstructure:"TOKEN_EXPIRES_IN"`
}

var AppConfig Config

// GetConfig returns the application configuration
func GetConfig() Config {
	return AppConfig
}

// LoadConfig loads configuration from config file or environment variables
func LoadConfig() {
	viper.SetConfigFile("config/config.yaml")

	// Set default values
	viper.SetDefault("DB_HOST", "localhost")
	viper.SetDefault("DB_PORT", "3306")
	viper.SetDefault("DB_USER", "root")
	viper.SetDefault("DB_PASSWORD", "password")
	viper.SetDefault("DB_NAME", "nhcommunity")
	viper.SetDefault("JWT_SECRET", "your-secret-key")
	viper.SetDefault("SERVER_PORT", "8080")
	viper.SetDefault("CLIENT_ORIGIN", "http://localhost:3000")
	viper.SetDefault("TOKEN_EXPIRES_IN", 60*24*30) // 30 days

	// Try to read config file
	err := viper.ReadInConfig()
	if err != nil {
		// If config file not found, create one with default values
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			// Create config directory if not exists
			os.MkdirAll("config", os.ModePerm)

			// Create config file with default values
			viper.WriteConfigAs("config/config.yaml")
			log.Println("Config file created with default values")
		} else {
			log.Fatalf("Error reading config file: %v", err)
		}
	}

	// Bind environment variables
	viper.AutomaticEnv()

	// Unmarshal config
	err = viper.Unmarshal(&AppConfig)
	if err != nil {
		log.Fatalf("Error unmarshalling config: %v", err)
	}

	log.Println("Configuration loaded successfully")
}

// SetupDB initializes database connection
func SetupDB() *gorm.DB {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		AppConfig.DBUser,
		AppConfig.DBPassword,
		AppConfig.DBHost,
		AppConfig.DBPort,
		AppConfig.DBName,
	)

	// Try to connect without creating the database first
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		// Database might not exist, try to create it
		log.Printf("Error connecting to database: %v. Attempting to create database...", err)
		rootDSN := fmt.Sprintf("%s:%s@tcp(%s:%s)/",
			AppConfig.DBUser,
			AppConfig.DBPassword,
			AppConfig.DBHost,
			AppConfig.DBPort,
		)

		rootDB, err := gorm.Open(mysql.Open(rootDSN), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err != nil {
			log.Fatalf("Failed to connect to MySQL: %v", err)
		}

		// Create database
		createDBSQL := fmt.Sprintf("CREATE DATABASE IF NOT EXISTS %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;", AppConfig.DBName)
		if err := rootDB.Exec(createDBSQL).Error; err != nil {
			log.Fatalf("Failed to create database: %v", err)
		}

		// Connect to the newly created database
		db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err != nil {
			log.Fatalf("Failed to connect to newly created database: %v", err)
		}

		log.Println("Database created successfully")
	} else {
		log.Println("Database connected successfully")
	}

	// Run migrations
	RunMigrations(db)

	// Verify that the users table exists after migration
	if !db.Migrator().HasTable(&models.User{}) {
		log.Println("CRITICAL ERROR: Users table still doesn't exist after migration!")
		log.Println("Attempting emergency migration...")

		// Try to create the users table directly
		if err := db.AutoMigrate(&models.User{}); err != nil {
			log.Fatalf("Emergency migration failed: %v", err)
		}

		// Verify again
		if !db.Migrator().HasTable(&models.User{}) {
			log.Fatalf("FATAL: Users table creation failed even after emergency migration")
		} else {
			log.Println("Emergency migration successful - users table now exists")
		}
	}

	return db
}

// ResetDatabase drops all tables and recreates them
func ResetDatabase(db *gorm.DB) {
	log.Println("WARNING: Resetting database - all data will be lost!")

	// Drop all tables
	if err := db.Exec("SET FOREIGN_KEY_CHECKS = 0").Error; err != nil {
		log.Printf("Warning: Failed to disable foreign key checks: %v", err)
	}

	// Drop tables without checking if they exist first
	log.Println("Dropping all tables forcefully...")

	// Try to drop messages table
	if err := db.Exec("DROP TABLE IF EXISTS messages").Error; err != nil {
		log.Printf("Warning: Failed to drop messages table: %v", err)
	}

	// Try to drop conversation_participants table
	if err := db.Exec("DROP TABLE IF EXISTS conversation_participants").Error; err != nil {
		log.Printf("Warning: Failed to drop conversation_participants table: %v", err)
	}

	// Try to drop conversations table
	if err := db.Exec("DROP TABLE IF EXISTS conversations").Error; err != nil {
		log.Printf("Warning: Failed to drop conversations table: %v", err)
	}

	// Try to drop partner_participants table
	if err := db.Exec("DROP TABLE IF EXISTS partner_participants").Error; err != nil {
		log.Printf("Warning: Failed to drop partner_participants table: %v", err)
	}

	// Try to drop partner_tags table
	if err := db.Exec("DROP TABLE IF EXISTS partner_tags").Error; err != nil {
		log.Printf("Warning: Failed to drop partner_tags table: %v", err)
	}

	// Try to drop partners table
	if err := db.Exec("DROP TABLE IF EXISTS partners").Error; err != nil {
		log.Printf("Warning: Failed to drop partners table: %v", err)
	}

	// ... other tables can be added here as needed

	if err := db.Exec("SET FOREIGN_KEY_CHECKS = 1").Error; err != nil {
		log.Printf("Warning: Failed to re-enable foreign key checks: %v", err)
	}

	log.Println("Tables dropped successfully. Running migrations to recreate tables...")
	RunMigrations(db)
}

func RunMigrations(db *gorm.DB) {
	log.Println("Running database migrations...")

	log.Println("Checking for 'users' table before migration...")
	if hasUsersTableBefore := db.Migrator().HasTable(&models.User{}); hasUsersTableBefore {
		log.Println("Result: 'users' table EXISTS before migration.")
	} else {
		log.Println("Result: 'users' table DOES NOT EXIST before migration.")
	}

	// First migrate base tables without foreign keys
	log.Println("Step 1: Migrating base tables...")
	err := db.AutoMigrate(
		&models.User{},
		&models.Partner{},
		&models.Conversation{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate base tables: %v", err)
	}

	// Then migrate tables with simpler foreign keys
	log.Println("Step 2: Migrating tables with simpler foreign keys...")
	err = db.AutoMigrate(
		&models.Post{},
		&models.Event{},
		&models.Course{},
		&models.Marketplace{},
		&models.LostFound{},
		&models.Confession{},
		&models.Notification{},
		&models.PartnerTag{},
		&models.ConversationParticipant{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate tables with simpler foreign keys: %v", err)
	}

	// Finally migrate tables with complex foreign keys
	log.Println("Step 3: Migrating tables with complex foreign keys...")
	err = db.AutoMigrate(
		&models.Comment{},
		&models.Like{},
		&models.EventAttendee{},
		&models.CourseReview{},
		&models.ConfessionLike{},
		&models.ConfessionComment{},
		&models.Message{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate tables with complex foreign keys: %v", err)
	}

	log.Println("Database migrations command completed.")

	log.Println("Checking for 'users' table after migration...")
	if hasUsersTableAfter := db.Migrator().HasTable(&models.User{}); hasUsersTableAfter {
		log.Println("Result: 'users' table EXISTS after migration.")
	} else {
		log.Println("Result: 'users' table DOES NOT EXIST after migration.")
	}
}
