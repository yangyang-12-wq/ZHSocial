import { 
  ApiResponse, 
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Partner,
  CreatePartnerRequest,
  Course,
  CourseReview,
  CreateCourseReviewRequest,
  MarketItem,
  CreateMarketItemRequest,
  Confession,
  CreateConfessionRequest,
  LostFoundItem,
  CreateLostFoundRequest,
  Event,
  CreateEventRequest,
  SearchParams,
  PaginationParams,
  Conversation,
  Message
} from './types';

// 在开发环境下，我们使用相对路径，以便 Next.js 的代理可以正常工作
// 在生产环境下，我们使用环境变量中配置的绝对路径
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api/v1' 
  : process.env.NEXT_PUBLIC_API_URL;

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL || '/api/v1'; // 提供一个默认值
    // 从 localStorage 获取 token
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // 检查token并添加认证头
    if (typeof window !== 'undefined') {
      // Always get the latest token from localStorage
      const freshToken = localStorage.getItem('token');
      if (freshToken) {
        this.token = freshToken;
        headers['Authorization'] = `Bearer ${freshToken}`;
      } else if (this.token) {
        // If no token in localStorage but we have one in memory, use it
        headers['Authorization'] = `Bearer ${this.token}`;
      }
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    // 特殊处理管理员API调用的详细日志
    if (endpoint.includes('/admin')) {
      console.log(`API请求: ${url}`, {
        方法: options.method || 'GET',
        头信息: headers,
        请求体: options.body ? JSON.parse(options.body as string) : undefined
      });
    }

    try {
      const response = await fetch(url, config);
      
      // 对管理员API添加详细日志
      if (endpoint.includes('/admin')) {
        console.log(`API响应状态: ${response.status} ${response.statusText}`);
        console.log(`API响应头:`, Object.fromEntries(response.headers.entries()));
      }
      
      if (!response.ok) {
        // For 404 errors, return empty data for specific types
        if (response.status === 404) {
          console.warn(`Endpoint not found: ${endpoint}. Returning empty data.`);
          // Check the expected return type and provide appropriate empty data
          const emptyResponse = this.getEmptyResponse<T>();
          return emptyResponse;
        }
        
        // 特殊处理401未授权错误
        if (response.status === 401) {
          console.warn(`未授权访问: ${endpoint}. 可能需要登录或令牌已过期。`);
          
          // 对于通知等非关键资源，返回空值
          if (endpoint.includes('/notifications') || 
              endpoint.includes('/user/favorites') || 
              endpoint.includes('/chats')) {
            console.warn("返回默认空数据，避免UI崩溃");
            return this.getEmptyResponse<T>();
          }
          
          // 对于管理员API，特殊处理
          if ((endpoint.includes('/admin/') || endpoint.includes('/admin')) && 
              typeof window !== 'undefined' && 
              window.location.pathname.includes('/admin')) {
            // 清除令牌并显示提示
            this.clearToken();
            alert('您的登录令牌不包含管理员权限或已过期，请重新登录以获取完整权限。');
            // 重定向到登录页
            window.location.href = '/login';
            return this.getEmptyResponse<T>();
          }
        }
        
        // 尝试读取响应体内容
        let responseText = '';
        try {
          responseText = await response.text();
          console.warn(`API错误响应内容: ${responseText}`);
        } catch (e) {
          console.warn('无法读取响应体内容');
        }
        
        // For other errors, try to parse the error message from the response
        let errorMessage: string;
        try {
          const errorData = responseText ? JSON.parse(responseText) : {};
          errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      // For successful responses, parse the JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const responseText = await response.text();
        
        // 对于管理员API添加响应内容详细日志
        if (endpoint.includes('/admin')) {
          console.log(`API响应内容: ${responseText}`);
        }
        
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          console.error(`JSON解析错误: ${e}`);
          throw new Error(`返回的不是有效JSON: ${responseText}`);
        }
        
        // Check if response is an ApiResponse and handle accordingly
        if (result && typeof result === 'object' && 'success' in result) {
          if (result.success) {
            // Special handling for endpoints that need the full ApiResponse
            if (endpoint.includes('/partners') || 
                endpoint.includes('/courses') ||
                endpoint.includes('/marketplace') ||
                endpoint.includes('/confessions') ||
                endpoint.includes('/lost-found') ||
                endpoint.includes('/events') ||
                endpoint.includes('/notifications') ||
                endpoint.includes('/admin/users')) {  // 添加admin/users到需要完整响应的列表
              return result as T;
            } else {
              return result.data as T;
            }
          } else {
            throw new Error(result.message || '操作失败，但未提供具体错误信息');
          }
        }
        
        // If response is not an ApiResponse, return it directly
        return result as T;
      } else {
        // Handle non-JSON responses
        return {} as T;
      }
    } catch (error) {
      console.error('API 请求失败:', error);
      throw error;
    }
  }

  // Helper method to generate appropriate empty responses based on expected return type
  private getEmptyResponse<T>(): T {
    // Get the expected return type from TypeScript generic
    // We can't use T directly at runtime, so we'll make educated guesses based on function name
    const functionName = new Error().stack?.split('\n')[2] || '';
    
    // Check for specific method names to determine return type
    if (functionName.includes('getPartnerCategories') || 
        functionName.includes('getPartnerTypes') ||
        functionName.includes('getCourseDepartments') ||
        functionName.includes('getCourseSemesters') ||
        functionName.includes('getUserFavorites') ||
        functionName.includes('getMessages') ||
        functionName.includes('searchUsers') ||
        functionName.includes('searchPosts') ||
        functionName.includes('getChatMessages') ||
        functionName.includes('getChatSessions')) {
      // Methods that return arrays
      return [] as unknown as T;
    } else if (functionName.includes('getNotifications') ||
              functionName.includes('getCourses') ||
              functionName.includes('getMarketItems') ||
              functionName.includes('getConfessions') ||
              functionName.includes('getLostFoundItems') ||
              functionName.includes('getEvents')) {
      // Methods that return ApiResponse objects
      return { 
        success: true, 
        message: 'No data found', 
        data: [] 
      } as unknown as T;
    } else if (functionName.includes('getConfessionMoods')) {
      // Special case for confession moods
      return ["happy", "sad", "angry", "confused", "excited"] as unknown as T;
    } else {
      // Default case for object return types
      return {} as T;
    }
  }

  // 设置认证 token
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  // 清除认证 token
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  // 验证token是否有效
  async validateToken(): Promise<boolean> {
    try {
      if (!this.token) {
        return false;
      }
      
      // Try to fetch the user profile as a validation test
      await this.getProfile();
      return true;
    } catch (error) {
      console.warn("Token validation failed:", error);
      this.clearToken();
      return false;
    }
  }

  // 认证相关 API
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    
      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `登录失败: HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Check if the response is in the expected format
      if (result && typeof result === 'object') {
        if (result.success && result.data && result.data.access_token) {
          this.setToken(result.data.access_token);
          return result;
        } else if (!result.success) {
          throw new Error(result.message || '登录失败，但未提供具体错误信息');
        }
      }
      
      // If response is not in expected format
      throw new Error('登录失败: 服务器返回了意外的响应格式');
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `注册失败: HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Check if the response is in the expected format
      if (result && typeof result === 'object') {
        if (result.success && result.data && result.data.access_token) {
          // 注册成功后可以选择是否自动登录
          this.setToken(result.data.access_token);
          return result;
        } else if (!result.success) {
          throw new Error(result.message || '注册失败，但未提供具体错误信息');
        }
      }
      
      // If response is not in expected format
      throw new Error('注册失败: 服务器返回了意外的响应格式');
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await this.request<null>('/auth/logout', {
      method: 'POST',
    });
    
    this.clearToken();
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async followUser(id: number): Promise<void> {
    await this.request<null>(`/users/${id}/follow`, {
      method: 'POST',
    });
  }

  async unfollowUser(id: number): Promise<void> {
    await this.request<null>(`/users/${id}/follow`, {
      method: 'DELETE',
    });
  }

  // 搭子广场 API
  async getPartners(params?: SearchParams): Promise<ApiResponse<Partner[]>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    // 注意：这个函数的返回值需要包含分页信息，所以我们直接返回整个 ApiResponse
    return this.request<ApiResponse<Partner[]>>(`/partners${queryString}`);
  }

  async getPartner(id: string): Promise<Partner> {
    return this.request<Partner>(`/partners/${id}`);
  }

  async createPartner(data: CreatePartnerRequest): Promise<Partner> {
    return this.request<Partner>('/partners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePartner(id: string, data: Partial<CreatePartnerRequest>): Promise<Partner> {
    return this.request<Partner>(`/partners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePartner(id: string): Promise<void> {
    await this.request<null>(`/partners/${id}`, {
      method: 'DELETE',
    });
  }

  async joinPartner(id: string): Promise<void> {
    // Check if token exists and is valid
    if (!this.token) {
      throw new Error('Authorization header is required: You must be logged in to join a partner');
    }
    
    await this.request<null>(`/partners/${id}/join`, {
      method: 'POST',
    });
  }

  async getPartnerCategories(): Promise<string[]> {
    return this.request<string[]>('/partners/categories');
  }

  async getPartnerTypes(): Promise<string[]> {
    return this.request<string[]>('/partners/types');
  }

  // 课程雷达 API
  async getCourses(params?: SearchParams): Promise<ApiResponse<Course[]>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<ApiResponse<Course[]>>(`/courses${queryString}`);
  }

  async getCourse(id: string): Promise<Course> {
    return this.request<Course>(`/courses/${id}`);
  }

  async getCourseReviews(courseId: string): Promise<CourseReview[]> {
    return this.request<CourseReview[]>(`/courses/${courseId}/reviews`);
  }

  async createCourseReview(data: CreateCourseReviewRequest): Promise<CourseReview> {
    return this.request<CourseReview>('/course-reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCourseRecommendations(): Promise<Course[]> {
    return this.request<Course[]>(`/courses/recommendations`);
  }

  // 获取所有开课院系
  async getCourseDepartments(): Promise<string[]> {
    return this.request<string[]>('/courses/departments');
  }

  // 获取所有开课学期
  async getCourseSemesters(): Promise<string[]> {
    return this.request<string[]>('/courses/semesters');
  }

  // 校园市场 API
  async getMarketItems(params?: SearchParams): Promise<ApiResponse<MarketItem[]>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<ApiResponse<MarketItem[]>>(`/marketplace${queryString}`);
  }

  async getMarketItem(id: string): Promise<MarketItem> {
    return this.request<MarketItem>(`/marketplace/${id}`);
  }

  async createMarketItem(data: CreateMarketItemRequest): Promise<MarketItem> {
    return this.request<MarketItem>('/marketplace', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMarketItem(id: string, data: Partial<CreateMarketItemRequest>): Promise<MarketItem> {
    return this.request<MarketItem>(`/marketplace/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMarketItem(id: string): Promise<void> {
    await this.request<null>(`/marketplace/${id}`, {
      method: 'DELETE',
    });
  }

  async getMarketplaceCategories(): Promise<string[]> {
    return this.request<string[]>('/marketplace/categories');
  }

  // 树洞 API
  async getConfessions(params?: SearchParams): Promise<ApiResponse<Confession[]>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<ApiResponse<Confession[]>>(`/confessions${queryString}`);
  }

  async createConfession(data: CreateConfessionRequest): Promise<Confession> {
    // 只保留后端支持的字段
    const payload = {
      content: data.content,
      image_url: data.imageURL || "",
      is_anonymous: data.isAnonymous !== undefined ? data.isAnonymous : true
    };
    
    return this.request<Confession>('/confessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async likeConfession(id: string): Promise<void> {
    await this.request<null>(`/confessions/${id}/like`, {
      method: 'POST',
    });
  }

  async getConfessionMoods(): Promise<string[]> {
    // 直接返回硬编码的心情列表，不再发送网络请求
    return Promise.resolve(["happy", "sad", "angry", "confused", "excited"]);
  }

  // 通用点赞功能
  async likePost(id: string, type: 'post' | 'confession' | 'market' | 'event' = 'post'): Promise<void> {
    await this.request<null>(`/${type}s/${id}/like`, {
      method: 'POST',
    });
  }
  
  // 取消点赞
  async unlikePost(id: string, type: 'post' | 'confession' | 'market' | 'event' = 'post'): Promise<void> {
    await this.request<null>(`/${type}s/${id}/unlike`, {
      method: 'POST',
    });
  }
  
  // 检查是否已点赞
  async checkLikeStatus(id: string, type: 'post' | 'confession' | 'market' | 'event' = 'post'): Promise<{liked: boolean}> {
    return this.request<{liked: boolean}>(`/${type}s/${id}/like-status`);
  }

  // 收藏功能
  async favoriteItem(id: string, type: 'post' | 'market' | 'event' | 'course' = 'post'): Promise<void> {
    await this.request<null>(`/${type}s/${id}/favorite`, {
      method: 'POST',
    });
  }
  
  // 取消收藏
  async unfavoriteItem(id: string, type: 'post' | 'market' | 'event' | 'course' = 'post'): Promise<void> {
    await this.request<null>(`/${type}s/${id}/unfavorite`, {
      method: 'POST',
    });
  }
  
  // 检查是否已收藏
  async checkFavoriteStatus(id: string, type: 'post' | 'market' | 'event' | 'course' = 'post'): Promise<{favorited: boolean}> {
    return this.request<{favorited: boolean}>(`/${type}s/${id}/favorite-status`);
  }
  
  // 获取用户收藏列表
  async getUserFavorites(type?: 'post' | 'market' | 'event' | 'course'): Promise<any[]> {
    const endpoint = type ? `/user/favorites/${type}s` : '/user/favorites';
    return this.request<any[]>(endpoint);
  }

  // 搜索功能
  async search(params: SearchParams & { type?: string }): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<any>(`/search${queryString}`);
  }
  
  // 搜索用户
  async searchUsers(keyword: string, params?: PaginationParams): Promise<User[]> {
    const queryParams = { ...params, keyword };
    const queryString = `?${new URLSearchParams(queryParams as any).toString()}`;
    return this.request<User[]>(`/search/users${queryString}`);
  }
  
  // 搜索帖子
  async searchPosts(keyword: string, params?: PaginationParams): Promise<any[]> {
    const queryParams = { ...params, keyword };
    const queryString = `?${new URLSearchParams(queryParams as any).toString()}`;
    return this.request<any[]>(`/search/posts${queryString}`);
  }
  
  // 搜索课程
  async searchCourses(keyword: string, params?: PaginationParams): Promise<Course[]> {
    const queryParams = { ...params, keyword };
    const queryString = `?${new URLSearchParams(queryParams as any).toString()}`;
    return this.request<Course[]>(`/search/courses${queryString}`);
  }
  
  // 搜索活动
  async searchEvents(keyword: string, params?: PaginationParams): Promise<Event[]> {
    const queryParams = { ...params, keyword };
    const queryString = `?${new URLSearchParams(queryParams as any).toString()}`;
    return this.request<Event[]>(`/search/events${queryString}`);
  }
  
  // 搜索闲置物品
  async searchMarketItems(keyword: string, params?: PaginationParams): Promise<MarketItem[]> {
    const queryParams = { ...params, keyword };
    const queryString = `?${new URLSearchParams(queryParams as any).toString()}`;
    return this.request<MarketItem[]>(`/search/marketplace${queryString}`);
  }

  // 聊天相关API
  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/conversations');
  }

  async getMessages(conversationId: number, params?: PaginationParams): Promise<Message[]> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<Message[]>(`/conversations/${conversationId}/messages${queryString}`);
  }

  async createChatSession(userId: string): Promise<{sessionId: string}> {
    // The 'data' object is now expected to be returned from the generic request handler
    return this.request<{sessionId: string}>('/chats', {
      method: 'POST',
      body: JSON.stringify({ userId: Number(userId) }), // Ensure ID is a number for the backend
    });
  }
  
  async getChatSessions(): Promise<any[]> {
    return this.request<any[]>('/chats');
  }
  
  async getChatMessages(sessionId: string, params?: {page?: number, limit?: number}): Promise<any[]> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<any[]>(`/chats/${sessionId}/messages${queryString}`);
  }
  
  async sendChatMessage(sessionId: string, content: string): Promise<any> {
    return this.request<any>(`/chats/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
  
  async markChatAsRead(sessionId: string): Promise<void> {
    await this.request<null>(`/chats/${sessionId}/read`, {
      method: 'POST',
    });
  }
  
  async getUnreadChatCount(): Promise<{count: number}> {
    return this.request<{count: number}>('/chats/unread-count');
  }

  // 联系卖家 - 针对闲置市场
  async contactSeller(itemId: string): Promise<{sessionId: string}> {
    return this.request<{sessionId: string}>(`/marketplace/${itemId}/contact`, {
      method: 'POST',
    });
  }

  // 失物招领 API
  async getLostFoundItems(params?: SearchParams): Promise<ApiResponse<LostFoundItem[]>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<ApiResponse<LostFoundItem[]>>(`/lost-found${queryString}`);
  }

  async createLostFoundItem(data: CreateLostFoundRequest): Promise<LostFoundItem> {
    return this.request<LostFoundItem>('/lost-found', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLostFoundItem(id: string, data: Partial<CreateLostFoundRequest>): Promise<LostFoundItem> {
    return this.request<LostFoundItem>(`/lost-found/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLostFoundItem(id: string): Promise<void> {
    await this.request<null>(`/lost-found/${id}`, {
      method: 'DELETE',
    });
  }

  // 活动 API
  async getEvents(params?: SearchParams): Promise<ApiResponse<Event[]>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<ApiResponse<Event[]>>(`/events${queryString}`);
  }

  async getEvent(id: string): Promise<Event> {
    return this.request<Event>(`/events/${id}`);
  }

  async createEvent(data: CreateEventRequest): Promise<Event> {
    return this.request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async registerForEvent(id: string): Promise<void> {
    await this.request<null>(`/events/${id}/register`, {
      method: 'POST',
    });
  }

  async getEventCategories(): Promise<string[]> {
    return this.request<string[]>('/events/categories');
  }

  // 文件上传 API
  async uploadFile(file: File, type: string = 'general'): Promise<{ filename: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request<{ filename: string; url: string }>('/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // 让浏览器自动设置 Content-Type
    });
  }

  // 健康检查 API
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  // 通知系统 API
  async getNotifications(params?: { page?: number; limit?: number; read?: boolean }): Promise<any> {
    try {
      // 检查是否有令牌，如果没有则返回空数组
      if (!this.token) {
        console.warn("获取通知失败: 未登录或会话已过期");
        return [];
      }
      
      const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
      return this.request<any>(`/notifications${queryString}`);
    } catch (error) {
      console.error("获取通知API错误:", error);
      // 返回空数组而不是抛出错误，这样UI不会崩溃
      return [];
    }
  }
  
  // 通知系统 API - 返回原始响应，不进行数据提取
  async getNotificationsRaw(params?: { page?: number; limit?: number; read?: boolean }): Promise<ApiResponse<any>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const url = `${this.baseUrl}/notifications${queryString}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 添加认证头
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`
        }));
        throw new Error(errorData.message || '请求失败');
      }

      return await response.json();
    } catch (error) {
      console.error('API 请求失败:', error);
      throw error;
    }
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request<null>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request<null>('/notifications/read-all', {
      method: 'POST',
    });
  }

  async deleteNotification(id: string): Promise<void> {
    await this.request<null>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // 管理员API - 获取待审核的树洞内容
  async getAdminConfessions(params?: {status?: string}): Promise<ApiResponse<any[]>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<ApiResponse<any[]>>(`/admin/confessions${queryString}`);
  }

  // 管理员API - 更新树洞审核状态
  async updateConfessionStatus(id: string, data: {status: string, isApproved: boolean}): Promise<void> {
    return this.request<void>(`/admin/confessions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 管理员API - 获取统计数据
  async getAdminStats(): Promise<{pendingCount: number, approvedCount: number, rejectedCount: number, totalUsers: number}> {
    try {
      console.log("API: 开始调用getAdminStats");
      console.log("API: Authorization头:", this.token ? `Bearer ${this.token}` : "无令牌");
      
      // 如果没有令牌，返回默认数据
      if (!this.token) {
        console.warn("API: 没有令牌，返回默认统计数据");
        return { 
          pendingCount: 0, 
          approvedCount: 0, 
          rejectedCount: 0, 
          totalUsers: 0 
        };
      }
      
      const result = await this.request<{pendingCount: number, approvedCount: number, rejectedCount: number, totalUsers: number}>('/admin/stats');
      console.log("API: 获取到管理员统计数据:", result);
      return result;
    } catch (error) {
      console.error("API: 获取管理员统计失败:", error);
      // 返回默认数据，避免UI崩溃
      return { 
        pendingCount: 0, 
        approvedCount: 0, 
        rejectedCount: 0, 
        totalUsers: 0 
      };
    }
  }

  // 管理员API - 获取所有用户
  async getAllUsers(params?: {page?: number, limit?: number, search?: string}): Promise<ApiResponse<any[]>> {
    try {
      console.log("API: 开始调用getAllUsers");
      
      // 如果没有令牌，返回默认数据
      if (!this.token) {
        console.warn("API: 没有令牌，返回默认用户列表");
        return { 
          success: true, 
          message: "默认空数据", 
          data: [] 
        };
      }
      
      const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
      const result = await this.request<ApiResponse<any[]>>(`/admin/users${queryString}`);
      console.log("API: 获取到用户列表:", result);
      return result;
    } catch (error) {
      console.error("API: 获取用户列表失败:", error);
      // 返回默认数据，避免UI崩溃
      return { 
        success: true, 
        message: "获取用户列表失败，返回默认数据", 
        data: [] 
      };
    }
  }

  // 管理员API - 更新用户角色
  async updateUserRole(userId: string, role: 'user' | 'moderator' | 'admin'): Promise<void> {
    return this.request<void>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // 管理员API - 更新用户状态
  async updateUserStatus(userId: string, status: boolean): Promise<void> {
    return this.request<void>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: status }),
    });
  }

  // 管理员API - 调试用户数据库
  async debugUserDatabase(): Promise<any> {
    try {
      console.log("API: 开始调用debugUserDatabase");
      console.log("API: 当前令牌:", this.token ? "有效" : "无效");
      
      if (!this.token) {
        console.warn("API: 没有令牌，无法进行调试查询");
        return { 
          success: false, 
          message: "未登录，无法执行调试操作" 
        };
      }
      
      const result = await this.request<any>('/admin/debug/users');
      console.log("API: 调试用户数据库结果:", result);
      return result;
    } catch (error) {
      console.error("API: 调试用户数据库失败:", error);
      return { 
        success: false, 
        message: "调试查询失败", 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
}

export const api = new ApiClient();

