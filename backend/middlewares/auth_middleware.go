package middlewares

import (
	"fmt"
	"net/http"
	"nhcommunity/utils"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT tokens and authorizes users
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		// Check if the header format is valid
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		// Extract the token
		tokenString := parts[1]

		// Validate the token
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": fmt.Sprintf("Invalid token: %v", err)})
			c.Abort()
			return
		}

		// Set user ID in the context
		c.Set("user_id", claims.UserID)
		// 保存完整的claims
		c.Set("claims", claims)
		// 如果claims中包含角色信息，直接设置到上下文
		if claims.Role != "" {
			c.Set("user_role", claims.Role)
			fmt.Printf("AuthMiddleware: 从JWT获取用户角色: %s\n", claims.Role)
		}
		c.Next()
	}
}

// AdminMiddleware 验证用户是否具有管理员权限
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从上下文中获取用户ID
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
			c.Abort()
			return
		}

		// 打印调试信息
		fmt.Printf("AdminMiddleware: 用户ID: %v\n", userID)

		// 从上下文中获取用户角色
		userRole, exists := c.Get("user_role")
		if !exists {
			// 如果上下文中没有角色信息，使用claims
			claims, exists := c.Get("claims")
			if exists {
				if jwtClaims, ok := claims.(*utils.JWTClaims); ok && jwtClaims.Role != "" {
					userRole = jwtClaims.Role
					fmt.Printf("AdminMiddleware: 从JWT获取角色: %s\n", userRole)
				}
			}
		} else {
			fmt.Printf("AdminMiddleware: 从上下文获取角色: %v\n", userRole)
		}

		// 将userRole转换为字符串类型
		roleStr := ""
		if userRole != nil {
			roleStr = fmt.Sprintf("%v", userRole)
		}

		// 验证用户是否为管理员
		if roleStr != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "没有管理员权限"})
			c.Abort()
			return
		}

		// 添加一个头信息，便于前端知道用户有管理员权限
		c.Header("X-Admin-Verified", "true")
		c.Next()
	}
}
