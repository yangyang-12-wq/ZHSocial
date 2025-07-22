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
  SearchParams
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
// 开发环境下使用本地API地址
const isDev = process.env.NODE_ENV === 'development';
const DEV_API_BASE_URL = 'http://localhost:8080/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = isDev ? DEV_API_BASE_URL : API_BASE_URL) {
    this.baseUrl = baseUrl;
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

    // 添加认证头
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
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

  // 认证相关 API
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.success) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse<null>> {
    const response = await this.request<ApiResponse<null>>('/auth/logout', {
      method: 'POST',
    });
    
    this.clearToken();
    return response;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/auth/profile');
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 搭子广场 API
  async getPartners(params?: SearchParams): Promise<ApiResponse<Partner[]>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<ApiResponse<Partner[]>>(`/partners${queryString}`);
  }

  async getPartner(id: string): Promise<ApiResponse<Partner>> {
    return this.request<ApiResponse<Partner>>(`/partners/${id}`);
  }

  async createPartner(data: CreatePartnerRequest): Promise<ApiResponse<Partner>> {
    return this.request<ApiResponse<Partner>>('/partners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePartner(id: string, data: Partial<CreatePartnerRequest>): Promise<ApiResponse<Partner>> {
    return this.request<ApiResponse<Partner>>(`/partners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePartner(id: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/partners/${id}`, {
      method: 'DELETE',
    });
  }

  async joinPartner(id: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/partners/${id}/join`, {
      method: 'POST',
    });
  }

  // 课程雷达 API
  async getCourses(params?: SearchParams): Promise<ApiResponse<Course[]>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<ApiResponse<Course[]>>(`/courses${queryString}`);
  }

  async getCourse(id: string): Promise<ApiResponse<Course>> {
    return this.request<ApiResponse<Course>>(`/courses/${id}`);
  }

  async getCourseReviews(courseId: string): Promise<ApiResponse<CourseReview[]>> {
    return this.request<ApiResponse<CourseReview[]>>(`/courses/${courseId}/reviews`);
  }

  async createCourseReview(data: CreateCourseReviewRequest): Promise<ApiResponse<CourseReview>> {
    return this.request<ApiResponse<CourseReview>>('/course-reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCourseRecommendations(): Promise<ApiResponse<Course[]>> {
    return this.request<ApiResponse<Course[]>>('/courses/recommendations');
  }

  // 校园市场 API
  async getMarketItems(params?: SearchParams): Promise<ApiResponse<MarketItem[]>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<ApiResponse<MarketItem[]>>(`/marketplace${queryString}`);
  }

  async getMarketItem(id: string): Promise<ApiResponse<MarketItem>> {
    return this.request<ApiResponse<MarketItem>>(`/marketplace/${id}`);
  }

  async createMarketItem(data: CreateMarketItemRequest): Promise<ApiResponse<MarketItem>> {
    return this.request<ApiResponse<MarketItem>>('/marketplace', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMarketItem(id: string, data: Partial<CreateMarketItemRequest>): Promise<ApiResponse<MarketItem>> {
    return this.request<ApiResponse<MarketItem>>(`/marketplace/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMarketItem(id: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/marketplace/${id}`, {
      method: 'DELETE',
    });
  }

  // 树洞 API
  async getConfessions(params?: SearchParams): Promise<ApiResponse<Confession[]>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<ApiResponse<Confession[]>>(`/confessions${queryString}`);
  }

  async createConfession(data: CreateConfessionRequest): Promise<ApiResponse<Confession>> {
    return this.request<ApiResponse<Confession>>('/confessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async likeConfession(id: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/confessions/${id}/like`, {
      method: 'POST',
    });
  }

  // 失物招领 API
  async getLostFoundItems(params?: SearchParams): Promise<ApiResponse<LostFoundItem[]>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<ApiResponse<LostFoundItem[]>>(`/lost-found${queryString}`);
  }

  async createLostFoundItem(data: CreateLostFoundRequest): Promise<ApiResponse<LostFoundItem>> {
    return this.request<ApiResponse<LostFoundItem>>('/lost-found', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLostFoundItem(id: string, data: Partial<CreateLostFoundRequest>): Promise<ApiResponse<LostFoundItem>> {
    return this.request<ApiResponse<LostFoundItem>>(`/lost-found/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLostFoundItem(id: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/lost-found/${id}`, {
      method: 'DELETE',
    });
  }

  // 活动 API
  async getEvents(params?: SearchParams): Promise<ApiResponse<Event[]>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<ApiResponse<Event[]>>(`/events${queryString}`);
  }

  async getEvent(id: string): Promise<ApiResponse<Event>> {
    return this.request<ApiResponse<Event>>(`/events/${id}`);
  }

  async createEvent(data: CreateEventRequest): Promise<ApiResponse<Event>> {
    return this.request<ApiResponse<Event>>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async registerForEvent(id: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/events/${id}/register`, {
      method: 'POST',
    });
  }

  // 文件上传 API
  async uploadFile(file: File, type: string = 'general'): Promise<ApiResponse<{ filename: string; url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request<ApiResponse<{ filename: string; url: string }>>('/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // 让浏览器自动设置 Content-Type
    });
  }

  // 健康检查 API
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request<ApiResponse<{ status: string }>>('/health');
  }

  // 通知系统 API
  async getNotifications(params?: { page?: number; limit?: number; read?: boolean }): Promise<ApiResponse<any>> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<ApiResponse<any>>(`/notifications${queryString}`);
  }

  async markNotificationRead(id: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead(): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>('/notifications/read-all', {
      method: 'POST',
    });
  }

  async deleteNotification(id: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }
}

// 创建单例实例
const apiClient = new ApiClient();

export default apiClient;