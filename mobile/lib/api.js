// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ 
  ? 'http://localhost:5000' // Development fallback
  : 'https://your-production-domain.com'); // Production fallback

export const API_ENDPOINTS = {
  // Authentication
  REGISTER: '/api/mobile/auth/register',
  LOGIN: '/api/mobile/auth/login',
  LOGOUT: '/api/mobile/auth/logout',
  SESSION: '/api/mobile/auth/session',
  
  // User Profile
  PROFILE: '/api/mobile/user/profile',
  UPDATE_PROFILE: '/api/mobile/user/profile',
  
  // Loyalty Cards
  USER_CARDS: '/api/mobile/user/cards',
  SCAN_NFC: '/api/mobile/scan',
  
  // Companies/Programs
  PROGRAMS: '/api/mobile/programs',
  PROGRAM_DETAILS: '/api/mobile/programs/',
};

// API utility functions
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for session cookies
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return { data, error: null };
    } catch (error) {
      console.error('API request failed:', error);
      return { data: null, error: error.message };
    }
  }

  // Authentication methods
  async register(userData) {
    return this.request(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request(API_ENDPOINTS.LOGOUT, {
      method: 'POST',
    });
  }

  async getSession() {
    return this.request(API_ENDPOINTS.SESSION);
  }

  // User profile methods
  async getProfile() {
    return this.request(API_ENDPOINTS.PROFILE);
  }

  async updateProfile(profileData) {
    return this.request(API_ENDPOINTS.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Loyalty card methods
  async getUserCards() {
    return this.request(API_ENDPOINTS.USER_CARDS);
  }

  async scanNFC(scanData) {
    return this.request(API_ENDPOINTS.SCAN_NFC, {
      method: 'POST',
      body: JSON.stringify(scanData),
    });
  }

  // Programs methods
  async getPrograms() {
    return this.request(API_ENDPOINTS.PROGRAMS);
  }

  async getProgramDetails(programId) {
    return this.request(`${API_ENDPOINTS.PROGRAM_DETAILS}${programId}`);
  }
}

export const apiService = new ApiService();
export default apiService;