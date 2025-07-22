package main

import (
	"fmt"
	"log"
	"os"
	
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// User 简化的用户模型
type User struct {
	ID           uint   `gorm:"primaryKey"`
	Username     string `gorm:"size:50;uniqueIndex;not null"`
	Email        string `gorm:"size:100;uniqueIndex;not null"`
	Role         string `gorm:"size:20;default:user"`
}

func main() {
	// 数据库连接字符串 - 修改为你的数据库配置
	dsn := "root:password@tcp(localhost:3306)/nhcommunity?charset=utf8mb4&parseTime=True&loc=Local"
	
	// 获取命令行参数
	args := os.Args
	if len(args) < 2 {
		fmt.Println("用法: go run scripts/update_admin.go <用户名或邮箱>")
		os.Exit(1)
	}
	
	usernameOrEmail := args[1]
	
	// 连接数据库
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("连接数据库失败: %v", err)
	}
	
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