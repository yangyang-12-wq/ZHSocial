package main

import (
	"fmt"
	"log"
	"nhcommunity/config"
	"nhcommunity/models"
	"nhcommunity/repositories"
	"os"
	"time"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	// 加载环境变量
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// 从环境变量获取管理员信息，如果没有则使用默认值
	adminUsername := getEnv("ADMIN_USERNAME", "admin")
	adminEmail := getEnv("ADMIN_EMAIL", "admin@example.com")
	adminPassword := getEnv("ADMIN_PASSWORD", "adminpassword")
	adminStudentId := getEnv("ADMIN_STUDENT_ID", "admin123")

	// 加载配置
	config.LoadConfig()
	cfg := config.GetConfig()

	// 初始化数据库连接
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 创建用户仓库
	userRepo := repositories.NewUserRepository(db)

	// 检查管理员是否已存在
	existingAdmin, err := userRepo.FindByUsername(adminUsername)
	if err == nil && existingAdmin != nil {
		fmt.Printf("管理员用户 '%s' 已存在\n", adminUsername)
		return
	}

	// 哈希密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// 创建管理员用户
	admin := &models.User{
		Username:  adminUsername,
		Email:     adminEmail,
		Password:  string(hashedPassword),
		StudentId: adminStudentId,
		Role:      "admin", // 设置为管理员角色
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// 保存管理员用户到数据库
	createdAdmin, err := userRepo.Create(admin)
	if err != nil {
		log.Fatalf("Failed to create admin user: %v", err)
	}

	fmt.Printf("管理员用户创建成功！\n")
	fmt.Printf("用户名: %s\n", createdAdmin.Username)
	fmt.Printf("邮箱: %s\n", createdAdmin.Email)
	fmt.Printf("角色: %s\n", createdAdmin.Role)
}

// 从环境变量获取值，如果不存在则使用默认值
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
