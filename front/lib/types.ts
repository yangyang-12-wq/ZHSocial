// 基础模型类型
export interface BaseModel {
  id: number; // 默认为 number，string 类型的模型可以覆盖
  createdAt: string;
  updatedAt: string;
}

// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string; // Add fullName
  studentId?: string;
  avatar_url?: string; // Corrected from avatarUrl
  avatar?: string;
  bio?: string;
  major?: string;
  grade?: string;
  contactInfo?: Record<string, any>;
  preferences?: Record<string, any>;
  isVerified: boolean;
  lastActiveAt: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  followerCount: number; // Add followerCount
  followingCount: number; // Add followingCount
  isFollowing?: boolean; // Add isFollowing
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  studentId?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
    expiresAt?: string;
  };
}

// 搭子广场类型
export interface Partner {
  id: string; // Partner ID 是 UUID string
  title: string;
  description: string;
  authorId: number; // 与 User ID 类型一致
  author: User;
  type: string;
  category: string;
  tags: string[];
  requirements?: string;
  location?: string;
  timePreference?: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'open' | 'closed' | 'completed';
  expiresAt?: string;
  matchScore?: number;
  recommendations?: Record<string, any>;
  participants: User[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerRequest {
  title: string;
  description: string;
  type: string;
  category: string;
  tags?: string[];
  requirements?: string;
  location?: string;
  timePreference?: string;
  maxParticipants: number;
  expiresAt?: string;
}

// 课程相关类型
export interface Course extends BaseModel {
  code: string;
  name: string;
  instructor: string;
  department: string;
  credit: number;
  semester: string;
  description?: string;
  prerequisites?: Record<string, any>;
  avgRating: number;
  avgDifficulty: number;
  reviewCount: number;
  enrollmentCount: number;
  popularityScore?: number;
  difficultyAnalysis?: Record<string, any>;
  sentimentAnalysis?: Record<string, any>;
}

export interface CourseReview extends BaseModel {
  courseId: string;
  course: Course;
  userId: string;
  user: User;
  rating: number;
  difficulty: number;
  workload: number;
  content: string;
  pros?: string;
  cons?: string;
  tips?: string;
  semester: string;
  verified: boolean;
  helpful: number;
  sentiment?: string;
  keywords?: Record<string, any>;
  credibilityScore?: number;
}

export interface CreateCourseReviewRequest {
  courseId: string;
  rating: number;
  difficulty: number;
  workload: number;
  content: string;
  pros?: string;
  cons?: string;
  tips?: string;
  semester: string;
}

// 市场商品类型
export interface MarketItem extends BaseModel {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  condition: string;
  images: string[];
  sellerId: string;
  seller: User;
  location: string;
  tags?: string[];
  status: 'available' | 'sold' | 'reserved';
  views: number;
  favorites: number;
  categoryConfidence?: number;
  priceRecommendation?: Record<string, any>;
  similarItems?: Record<string, any>;
}

export interface CreateMarketItemRequest {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  condition: string;
  images?: string[];
  location: string;
  tags?: string[];
}

// 树洞类型
export interface Confession extends BaseModel {
  content: string;
  imageURL?: string; // 添加imageURL字段
  authorId?: string;
  author?: User;
  isAnonymous: boolean;
  category?: string; // 改为可选，因为后端可能不支持
  mood?: string; // 保留前端使用
  tags?: string[];
  likes: number;
  comments: number;
  reports: number;
  status: 'active' | 'hidden' | 'deleted' | 'pending'; // 添加pending状态
  isApproved?: boolean; // 添加审核状态
  sentimentScore?: Record<string, any>;
  riskLevel?: string;
  moderationFlags?: Record<string, any>;
}

export interface CreateConfessionRequest {
  content: string;
  imageURL?: string; // 添加imageURL字段，与后端一致
  isAnonymous?: boolean;
  // 删除不支持的字段
  mood?: string; // 保留前端使用，不会发送到后端
}

// 失物招领类型
export interface LostFoundItem extends BaseModel {
  title: string;
  description: string;
  type: 'lost' | 'found';
  category: string;
  location: string;
  foundLocation?: string;
  lostDate?: string;
  foundDate?: string;
  images?: string[];
  contact: Record<string, any>;
  authorId: string;
  author: User;
  status: 'open' | 'matched' | 'closed';
  matchedItems?: Record<string, any>;
}

export interface CreateLostFoundRequest {
  title: string;
  description: string;
  type: 'lost' | 'found';
  category: string;
  location: string;
  foundLocation?: string;
  lostDate?: string;
  foundDate?: string;
  images?: string[];
  contact: Record<string, any>;
}

// 活动类型
export interface Event extends BaseModel {
  title: string;
  description: string;
  organizer: string;
  organizerId: string;
  organizerUser: User;
  category: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity?: number;
  enrolled: number;
  fee?: number;
  tags?: string[];
  images?: string[];
  likes?: number;
  shares?: number;
  requirements?: Record<string, any>;
  contact?: Record<string, any>;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  registrationDeadline?: string;
  recommendationScore?: number;
  attendeeProfile?: Record<string, any>;
  participants: User[];
}

export interface CreateEventRequest {
  title: string;
  description: string;
  organizer: string;
  category: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity?: number;
  fee?: number;
  tags?: string[];
  requirements?: Record<string, any>;
  contact?: Record<string, any>;
  registrationDeadline?: string;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  details?: Record<string, any>;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 搜索参数
export interface SearchParams extends PaginationParams {
  keyword?: string;
  category?: string;
  type?: string;
  tags?: string[];
  location?: string;
  status?: string;
  mood?: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  role: string;
  is_active: boolean;
  created_at: string;
  level?: string; // Add optional level
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author: UserResponse;
  category: string;
  time: string;
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  tags: string[];
  image?: string;
  status?: string;
  description?: string;
} 

// --- Chat Types ---

export interface Conversation {
  id: number;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  sender: User;
  content: string;
  isRead: boolean;
  createdAt: string;
}


// --- WebSocket Types ---

export interface PrivateMessagePayload {
  recipientId: number;
  content: string;
  senderId?: number; // senderId can be part of the payload from server
}

export interface WebsocketMessage {
  type: string;
  payload: PrivateMessagePayload | any; // Can be more specific with other payload types
  timestamp: string;
} 