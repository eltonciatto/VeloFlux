// Token storage service
import Cookies from 'js-cookie';

export class TokenService {
  private static readonly TOKEN_KEY = 'vf_auth_token';
  private static readonly USER_KEY = 'vf_user_info';
  
  // Get token from cookie (in production) or localStorage (in development)
  static getToken(): string | null {
    // In a production environment, the cookie would be HttpOnly and not accessible via JS
    // This is a simplified implementation for development purposes
    return Cookies.get(this.TOKEN_KEY) || localStorage.getItem(this.TOKEN_KEY);
  }
  
  // Set token in cookie
  static setToken(token: string): void {
    // In production, this would be set by the server with HttpOnly flag
    Cookies.set(this.TOKEN_KEY, token, { 
      expires: 1, // 1 day
      secure: window.location.protocol === 'https:', // Secure in HTTPS
      sameSite: 'strict' // Prevent CSRF
    });
    
    // Keep localStorage for backward compatibility during transition
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  // Remove token
  static removeToken(): void {
    Cookies.remove(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }
  
  // Get user info from localStorage
  static getUserInfo(): any {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  }
  
  // Set user info in localStorage
  static setUserInfo(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
  
  // Remove user info
  static removeUserInfo(): void {
    localStorage.removeItem(this.USER_KEY);
  }
  
  // Clear all auth data
  static clearAll(): void {
    this.removeToken();
    this.removeUserInfo();
  }
}
