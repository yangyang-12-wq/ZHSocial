package routes

import (
	"nhcommunity/config"
	"nhcommunity/controllers"
	"nhcommunity/middlewares"
	"nhcommunity/repositories"
	"nhcommunity/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRoutes initializes all API routes
func SetupRoutes(router *gin.Engine, db *gorm.DB, hub *services.Hub) {
	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{config.GetConfig().ClientOrigin}
	corsConfig.AllowCredentials = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"}

	router.Use(cors.New(corsConfig))

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	confessionRepo := repositories.NewConfessionRepository(db)
	postRepo := repositories.NewPostRepository(db)
	eventRepo := repositories.NewEventRepository(db)
	courseRepo := repositories.NewCourseRepository(db)
	marketplaceRepo := repositories.NewMarketplaceRepository(db)
	lostFoundRepo := repositories.NewLostFoundRepository(db)
	notificationRepo := repositories.NewNotificationRepository(db)
	partnerRepo := repositories.NewPartnerRepository(db)
	chatRepo := repositories.NewChatRepository(db)

	// Initialize services
	userService := services.NewUserService(userRepo)
	confessionService := services.NewConfessionService(confessionRepo)
	postService := services.NewPostService(postRepo)
	eventService := services.NewEventService(eventRepo)
	courseService := services.NewCourseService(courseRepo)
	marketplaceService := services.NewMarketplaceService(marketplaceRepo)
	lostFoundService := services.NewLostFoundService(lostFoundRepo)
	notificationService := services.NewNotificationService(notificationRepo)
	partnerService := services.NewPartnerService(partnerRepo)
	chatService := services.NewChatService(db, chatRepo)

	// Create controller instances
	userController := controllers.NewUserController(userService)
	authController := controllers.NewAuthController(userService, db)
	postController := controllers.NewPostController(postService)
	eventController := controllers.NewEventController(eventService)
	courseController := controllers.NewCourseController(courseService)
	marketplaceController := controllers.NewMarketplaceController(marketplaceService)
	lostFoundController := controllers.NewLostFoundController(lostFoundService)
	confessionController := controllers.NewConfessionController(confessionService)
	notificationController := controllers.NewNotificationController(notificationService)
	partnerController := controllers.NewPartnerController(partnerService)
	chatController := controllers.NewChatController(chatService, hub)

	// API v1 group
	api := router.Group("/api/v1")

	// Public routes
	{
		// Auth routes
		auth := api.Group("/auth")
		auth.POST("/register", authController.Register)
		auth.POST("/login", authController.Login)
		auth.GET("/refresh", authController.RefreshToken)

		// Search routes
		search := api.Group("/search")
		search.GET("/posts", postController.SearchPosts)

		// Public data routes
		api.GET("/posts", postController.GetPosts)
		api.GET("/posts/:id", postController.GetPostByID)
		api.GET("/events", eventController.GetEvents)
		api.GET("/events/:id", eventController.GetEventByID)
		api.GET("/events/categories", eventController.GetCategories)
		api.GET("/courses", courseController.GetCourses)
		api.GET("/courses/:id", courseController.GetCourseByID)
		api.GET("/marketplace", marketplaceController.GetListings)
		api.GET("/marketplace/:id", marketplaceController.GetListingByID)
		api.GET("/lost-found", lostFoundController.GetItems)
		api.GET("/lost-found/:id", lostFoundController.GetItemByID)
		api.GET("/confessions", confessionController.GetConfessions)
		api.GET("/confessions/:id", confessionController.GetConfessionByID)
		api.GET("/partners", partnerController.GetPartners)
		api.GET("/partners/categories", partnerController.GetPartnerCategories)
		api.GET("/partners/types", partnerController.GetPartnerTypes)
		api.GET("/partners/:id", partnerController.GetPartnerByID)
	}

	// Protected routes (require authentication)
	authorized := api.Group("/")
	authorized.Use(middlewares.AuthMiddleware())
	{
		// WebSocket chat route
		authorized.GET("/ws/chat", chatController.ServeWs)

		// Chat routes
		authorized.GET("/conversations", chatController.GetConversations)
		authorized.GET("/conversations/:id/messages", chatController.GetMessages)
		authorized.POST("/chats", chatController.CreateChatSession)

		// User routes
		user := authorized.Group("/users")
		user.GET("/me", userController.GetCurrentUser)
		user.PUT("/me", userController.UpdateCurrentUser)
		user.GET("/:id", userController.GetUserByID)
		user.POST("/:id/follow", userController.Follow)
		user.DELETE("/:id/follow", userController.Unfollow)

		// Post routes
		authorized.POST("/posts", postController.CreatePost)
		authorized.PUT("/posts/:id", postController.UpdatePost)
		authorized.DELETE("/posts/:id", postController.DeletePost)
		authorized.POST("/posts/:id/like", postController.LikePost)
		authorized.DELETE("/posts/:id/like", postController.UnlikePost)

		// Comment routes
		authorized.POST("/posts/:id/comments", postController.CreateComment)
		authorized.PUT("/comments/:id", postController.UpdateComment)
		authorized.DELETE("/comments/:id", postController.DeleteComment)

		// Event routes
		authorized.POST("/events", eventController.CreateEvent)
		authorized.PUT("/events/:id", eventController.UpdateEvent)
		authorized.DELETE("/events/:id", eventController.DeleteEvent)
		authorized.POST("/events/:id/join", eventController.JoinEvent)
		authorized.DELETE("/events/:id/join", eventController.LeaveEvent)

		// Course routes
		authorized.POST("/courses", courseController.CreateCourse)
		authorized.PUT("/courses/:id", courseController.UpdateCourse)
		authorized.DELETE("/courses/:id", courseController.DeleteCourse)
		authorized.GET("/courses/:id/reviews", courseController.GetCourseReviews)
		authorized.POST("/courses/:id/reviews", courseController.CreateCourseReview)
		authorized.PUT("/courses/reviews/:reviewId", courseController.UpdateCourseReview)
		authorized.DELETE("/courses/reviews/:reviewId", courseController.DeleteCourseReview)

		// Marketplace routes
		authorized.POST("/marketplace", marketplaceController.CreateListing)
		authorized.PUT("/marketplace/:id", marketplaceController.UpdateListing)
		authorized.DELETE("/marketplace/:id", marketplaceController.DeleteListing)

		// Lost & Found routes
		authorized.POST("/lost-found", lostFoundController.CreateItem)
		authorized.PUT("/lost-found/:id", lostFoundController.UpdateItem)
		authorized.DELETE("/lost-found/:id", lostFoundController.DeleteItem)

		// Confession routes
		authorized.POST("/confessions", confessionController.CreateConfession)
		authorized.PUT("/confessions/:id", confessionController.UpdateConfession)
		authorized.DELETE("/confessions/:id", confessionController.DeleteConfession)
		authorized.POST("/confessions/:id/like", confessionController.LikeConfession)
		authorized.DELETE("/confessions/:id/like", confessionController.UnlikeConfession)
		authorized.POST("/confessions/:id/comments", confessionController.CreateComment)
		authorized.PUT("/confessions/comments/:commentId", confessionController.UpdateComment)
		authorized.DELETE("/confessions/comments/:commentId", confessionController.DeleteComment)

		// Notification routes
		authorized.GET("/notifications", notificationController.GetNotifications)
		authorized.PUT("/notifications/:id", notificationController.MarkAsRead)
		authorized.PUT("/notifications", notificationController.MarkAllAsRead)

		// Partner routes
		partner := authorized.Group("/partners")
		partner.POST("", partnerController.CreatePartner)
		partner.PUT("/:id", partnerController.UpdatePartner)
		partner.DELETE("/:id", partnerController.DeletePartner)
		partner.POST("/:id/join", partnerController.JoinPartner)
		partner.DELETE("/:id/leave", partnerController.LeavePartner)
	}

	// 在 authorized 路由组后添加管理员路由组

	// 管理员路由 (需要管理员权限)
	admin := api.Group("/admin")
	admin.Use(middlewares.AuthMiddleware(), middlewares.AdminMiddleware())
	{
		// 调试接口
		admin.GET("/debug/users", userController.DebugUserDatabase)

		// 管理员统计数据
		admin.GET("/stats", confessionController.GetAdminStats)

		// 树洞管理
		admin.GET("/confessions", confessionController.GetAdminConfessions)
		admin.PUT("/confessions/:id/status", confessionController.UpdateConfessionStatus)

		// 用户管理
		admin.GET("/users", userController.GetAllUsers)
		admin.PUT("/users/:id/status", userController.UpdateUserStatus)
		admin.PUT("/users/:id/role", userController.UpdateUserRole) // 添加用户角色管理API

		// 系统设置
		// TODO: 实现系统设置控制器和方法
		// admin.GET("/settings", controllers.GetSystemSettings)
		// admin.PUT("/settings", controllers.UpdateSystemSettings)
	}
}
