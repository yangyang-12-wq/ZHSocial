package main

import (
	"fmt"
	"log"
	"nhcommunity/models"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	// 从命令行参数或环境变量获取数据库连接信息
	dbUser := getEnv("DB_USER", "root")
	dbPass := getEnv("DB_PASSWORD", "password")
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "3306")
	dbName := getEnv("DB_NAME", "nhcommunity")

	// 构建数据源名称(DSN)
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPass, dbHost, dbPort, dbName)

	// 连接到数据库
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("无法连接到数据库: %v", err)
	}
	log.Println("成功连接到数据库")

	// 确保users表存在
	if !db.Migrator().HasTable(&models.User{}) {
		log.Println("users表不存在，创建表...")
		if err := db.AutoMigrate(&models.User{}); err != nil {
			log.Fatalf("创建users表失败: %v", err)
		}
		log.Println("成功创建users表")
	} else {
		log.Println("users表已存在")
	}

	// 查找管理员用户
	var adminCount int64
	db.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount)

	if adminCount > 0 {
		log.Printf("找到 %d 个管理员用户", adminCount)
		var admins []models.User
		db.Where("role = ?", "admin").Find(&admins)
		for i, admin := range admins {
			log.Printf("管理员 %d: ID=%d, 用户名=%s, 邮箱=%s", i+1, admin.ID, admin.Username, admin.Email)
		}
	} else {
		log.Println("没有找到管理员用户，创建默认管理员...")
		
		// 创建默认管理员
		admin := models.User{
			Username: "admin",
			Email:    "admin@example.com",
			Password: "admin123",
			FullName: "管理员",
			Role:     "admin",
			IsActive: true,
		}

		// 手动哈希密码
		if err := admin.HashPassword(); err != nil {
			log.Fatalf("密码哈希失败: %v", err)
		}

		// 保存到数据库
		if err := db.Create(&admin).Error; err != nil {
			log.Fatalf("创建管理员失败: %v", err)
		}
		
		log.Printf("成功创建管理员: ID=%d, 用户名=%s, 邮箱=%s", admin.ID, admin.Username, admin.Email)
	}
	
	// 创建一个普通用户（如果不存在）
	var regularUserCount int64
	db.Model(&models.User{}).Where("role = ?", "user").Count(&regularUserCount)
	
	if regularUserCount == 0 {
		log.Println("没有找到普通用户，创建默认用户...")
		
		// 创建默认用户
		user := models.User{
			Username: "user",
			Email:    "user@example.com",
			Password: "user123",
			FullName: "普通用户",
			Role:     "user",
			IsActive: true,
		}

		// 手动哈希密码
		if err := user.HashPassword(); err != nil {
			log.Fatalf("密码哈希失败: %v", err)
		}

		// 保存到数据库
		if err := db.Create(&user).Error; err != nil {
			log.Fatalf("创建用户失败: %v", err)
		}
		
		log.Printf("成功创建普通用户: ID=%d, 用户名=%s, 邮箱=%s", user.ID, user.Username, user.Email)
	} else {
		log.Printf("找到 %d 个普通用户", regularUserCount)
		var users []models.User
		db.Where("role = ?", "user").Limit(5).Find(&users)
		for i, user := range users {
			log.Printf("普通用户 %d: ID=%d, 用户名=%s, 邮箱=%s", i+1, user.ID, user.Username, user.Email)
		}
	}
	
	// 显示数据库中的总用户数
	var totalUsers int64
	db.Model(&models.User{}).Count(&totalUsers)
	log.Printf("数据库中总共有 %d 个用户", totalUsers)
}

// 从环境变量获取值，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
} 