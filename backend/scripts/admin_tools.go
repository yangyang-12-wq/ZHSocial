package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// User 简化的用户模型
type User struct {
	ID           uint      `gorm:"primaryKey"`
	Username     string    `gorm:"size:50;uniqueIndex;not null"`
	Email        string    `gorm:"size:100;uniqueIndex;not null"`
	Password     string    `gorm:"size:100;not null"`
	FullName     string    `gorm:"size:100"`
	AvatarURL    string    `gorm:"size:500"`
	Bio          string    `gorm:"size:500"`
	StudentId    string    `gorm:"size:50;uniqueIndex"`
	RefreshToken string    `gorm:"size:500"`
	Role         string    `gorm:"size:20;default:user"`
	IsActive     bool      `gorm:"default:true"`
	CreatedAt    time.Time `gorm:"not null"`
	UpdatedAt    time.Time `gorm:"not null"`
}

func main() {
	// 数据库连接字符串 - 修改为你的数据库配置
	dsn := "root:password@tcp(localhost:3306)/nhcommunity?charset=utf8mb4&parseTime=True&loc=Local"

	// 获取命令行参数
	args := os.Args

	// 显示帮助信息
	if len(args) < 2 || args[1] == "-h" || args[1] == "--help" {
		showHelp()
		return
	}

	// 连接数据库
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("连接数据库失败: %v", err)
	}

	// 处理命令
	command := args[1]

	switch command {
	case "create":
		// 创建管理员账号
		createAdmin(db)
	case "update":
		// 更新用户为管理员
		if len(args) < 3 {
			fmt.Println("错误: 需要提供用户名或邮箱")
			fmt.Println("用法: go run scripts/admin_tools.go update <用户名或邮箱>")
			return
		}
		updateUserToAdmin(db, args[2])
	default:
		fmt.Printf("错误: 未知命令 '%s'\n", command)
		showHelp()
	}
}

// 显示帮助信息
func showHelp() {
	fmt.Println("管理员工具使用帮助:")
	fmt.Println("创建管理员账号:  go run scripts/admin_tools.go create")
	fmt.Println("更新用户为管理员: go run scripts/admin_tools.go update <用户名或邮箱>")
}

// 创建管理员账号
func createAdmin(db *gorm.DB) {
	// 管理员账户配置
	adminUsername := "admin"
	adminEmail := "admin@example.com"
	adminPassword := "admin123"

	// 检查是否已存在此用户名或邮箱
	var existingUser User
	result := db.Where("username = ? OR email = ?", adminUsername, adminEmail).First(&existingUser)
	if result.Error == nil {
		fmt.Printf("已存在用户名为 '%s' 或邮箱为 '%s' 的用户\n", adminUsername, adminEmail)

		// 检查该用户是否已经是管理员
		if existingUser.Role == "admin" {
			fmt.Printf("用户 '%s' 已经是管理员\n", adminUsername)
		} else {
			// 更新为管理员权限
			db.Model(&existingUser).Update("role", "admin")
			fmt.Printf("已将用户 '%s' 的权限更新为管理员\n", adminUsername)
		}
		return
	}

	// 对密码进行哈希处理
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("密码哈希失败: %v", err)
	}

	// 创建管理员用户
	admin := User{
		Username:  adminUsername,
		Email:     adminEmail,
		Password:  string(hashedPassword),
		FullName:  "管理员",
		Role:      "admin",
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	result = db.Create(&admin)
	if result.Error != nil {
		log.Fatalf("创建管理员用户失败: %v", result.Error)
	}

	fmt.Println("管理员用户创建成功!")
	fmt.Printf("用户名: %s\n", adminUsername)
	fmt.Printf("邮箱: %s\n", adminEmail)
	fmt.Printf("密码: %s\n", adminPassword)
}

// 更新指定用户为管理员
func updateUserToAdmin(db *gorm.DB, usernameOrEmail string) {
	// 查找用户
	var user User
	result := db.Where("username = ? OR email = ?", usernameOrEmail, usernameOrEmail).First(&user)
	if result.Error != nil {
		log.Fatalf("找不到用户 '%s': %v", usernameOrEmail, result.Error)
	}

	fmt.Printf("找到用户: %s (ID: %d, 邮箱: %s)\n", user.Username, user.ID, user.Email)
	fmt.Printf("当前角色: %s\n", user.Role)

	// 如果用户已经是管理员，则不需要更新
	if user.Role == "admin" {
		fmt.Printf("用户 '%s' 已经是管理员\n", user.Username)
		return
	}

	// 更新角色为管理员
	result = db.Model(&user).Update("role", "admin")
	if result.Error != nil {
		log.Fatalf("更新用户角色失败: %v", result.Error)
	}

	fmt.Printf("已成功将用户 '%s' 设置为管理员\n", user.Username)
}
