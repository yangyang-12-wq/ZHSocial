package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"nhcommunity/models"

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

	// 创建自定义日志记录器，显示所有SQL语句
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: false,
			Colorful:                  true,
		},
	)

	// 连接到数据库
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: newLogger,
	})
	if err != nil {
		log.Fatalf("无法连接到数据库: %v", err)
	}
	log.Println("成功连接到数据库")

	// 检查users表是否存在
	if !db.Migrator().HasTable(&models.User{}) {
		log.Fatalf("错误: users表不存在!")
	}
	log.Println("users表存在")

	// 查询所有用户
	var users []models.User
	result := db.Debug().Find(&users)
	if result.Error != nil {
		log.Fatalf("查询失败: %v", result.Error)
	}

	// 显示用户数量
	log.Printf("找到 %d 个用户", len(users))

	// 显示用户详细信息
	fmt.Println("\n========== 用户列表 ==========")
	if len(users) == 0 {
		fmt.Println("没有找到用户")
	} else {
		fmt.Printf("%-5s %-15s %-30s %-15s %-10s %-10s\n", "ID", "用户名", "邮箱", "角色", "状态", "创建时间")
		fmt.Println("-------------------------------------------------------------------------------------")
		for _, user := range users {
			fmt.Printf("%-5d %-15s %-30s %-15s %-10t %s\n",
				user.ID,
				user.Username,
				user.Email,
				user.Role,
				user.IsActive,
				user.CreatedAt.Format("2006-01-02 15:04:05"))
		}
	}

	// 执行原始SQL查询用户表信息（以防GORM查询有问题）
	var rawUsers []map[string]interface{}
	db.Raw("SELECT id, username, email, role, is_active FROM users").Scan(&rawUsers)

	fmt.Println("\n========== 原始SQL查询结果 ==========")
	if len(rawUsers) == 0 {
		fmt.Println("原始SQL查询没有找到用户")
	} else {
		for i, user := range rawUsers {
			fmt.Printf("用户 %d: %v\n", i+1, user)
		}
	}
}

// 从环境变量获取值，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
