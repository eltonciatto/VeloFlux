import { renderHook, act } from '@testing-library/react';
import { AuthProvider } from '../auth-provider';
import { useAuth } from '../use-auth';
import { TokenService } from '@/lib/tokenService';

// Mock do TokenService
jest.mock('@/lib/tokenService', () => ({
  TokenService: {
    getToken: jest.fn(),
    setToken: jest.fn(),
    getUserInfo: jest.fn(),
    setUserInfo: jest.fn(),
    clearAll: jest.fn(),
  },
}));

// Mock do safeApiFetch
jest.mock('@/lib/csrfToken', () => ({
  safeApiFetch: jest.fn(),
}));

const mockTokenService = TokenService as jest.Mocked<typeof TokenService>;
const { safeApiFetch } = require('@/lib/csrfToken');

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should initialize with stored token and user', () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    mockTokenService.getToken.mockReturnValue('mock-token');
    mockTokenService.getUserInfo.mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.token).toBe('mock-token');
    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle login successfully', async () => {
    const mockResponse = { token: 'new-token' };
    safeApiFetch.mockResolvedValueOnce(mockResponse);
    
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    safeApiFetch.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(mockTokenService.setToken).toHaveBeenCalledWith('new-token');
    expect(result.current.token).toBe('new-token');
  });

  it('should handle login failure with rate limiting', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Simulate multiple failed attempts
    safeApiFetch.mockRejectedValue(new Error('Invalid credentials'));

    for (let i = 0; i < 5; i++) {
      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrong-password');
        } catch (error) {
          // Expected to fail
        }
      });
    }

    // Next attempt should be blocked
    await act(async () => {
      try {
        await result.current.login('test@example.com', 'password');
        fail('Should have thrown rate limit error');
      } catch (error) {
        expect(error.message).toContain('Too many login attempts');
      }
    });
  });

  it('should refresh token successfully', async () => {
    const mockResponse = { token: 'refreshed-token' };
    safeApiFetch.mockResolvedValueOnce(mockResponse);
    mockTokenService.getToken.mockReturnValue('old-token');

    const { result } = renderHook(() => useAuth(), { wrapper });

    let refreshResult;
    await act(async () => {
      refreshResult = await result.current.refreshToken();
    });

    expect(refreshResult).toBe(true);
    expect(mockTokenService.setToken).toHaveBeenCalledWith('refreshed-token');
  });

  it('should handle logout correctly', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(mockTokenService.clearAll).toHaveBeenCalled();
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('should update profile successfully', async () => {
    const updatedUser = { id: '1', name: 'Updated User', email: 'test@example.com' };
    safeApiFetch.mockResolvedValueOnce(updatedUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.updateProfile('Updated', 'User');
    });

    expect(mockTokenService.setUserInfo).toHaveBeenCalledWith(updatedUser);
    expect(result.current.user).toEqual(updatedUser);
  });

  it('should handle token refresh failure', async () => {
    safeApiFetch.mockRejectedValueOnce(new Error('Refresh failed'));
    mockTokenService.getToken.mockReturnValue('old-token');

    const { result } = renderHook(() => useAuth(), { wrapper });

    let refreshResult;
    await act(async () => {
      refreshResult = await result.current.refreshToken();
    });

    expect(refreshResult).toBe(false);
  });
});
