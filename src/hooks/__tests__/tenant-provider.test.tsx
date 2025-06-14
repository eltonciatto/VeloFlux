import { renderHook, act } from '@testing-library/react';
import { TenantProvider } from '../tenant-provider';
import { useTenant } from '../use-tenant';

// Mock do localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

import { safeApiFetch } from '@/lib/csrfToken';

// Mock do safeApiFetch
jest.mock('@/lib/csrfToken', () => ({
  safeApiFetch: jest.fn(),
}));

describe('TenantProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TenantProvider>{children}</TenantProvider>
  );

  it('should initialize with stored tenant', () => {
    const mockTenant = { id: 'tenant-1', name: 'Test Tenant' };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockTenant));

    const { result } = renderHook(() => useTenant(), { wrapper });

    expect(result.current.selectedTenant).toEqual(mockTenant);
  });

  it('should load tenants successfully', async () => {
    const mockTenants = [
      { id: 'tenant-1', name: 'Tenant 1' },
      { id: 'tenant-2', name: 'Tenant 2' },
    ];
    safeApiFetch.mockResolvedValueOnce(mockTenants);

    const { result } = renderHook(() => useTenant(), { wrapper });

    await act(async () => {
      await result.current.loadTenants();
    });

    expect(result.current.tenants).toEqual(mockTenants);
    expect(result.current.loading).toBe(false);
  });

  it('should handle tenant loading error', async () => {
    safeApiFetch.mockRejectedValueOnce(new Error('Failed to load tenants'));

    const { result } = renderHook(() => useTenant(), { wrapper });

    await act(async () => {
      await result.current.loadTenants();
    });

    expect(result.current.tenants).toEqual([]);
    expect(result.current.error).toBe('Failed to load tenants');
    expect(result.current.loading).toBe(false);
  });

  it('should select tenant and store in localStorage', () => {
    const tenant = { id: 'tenant-1', name: 'Test Tenant' };
    const { result } = renderHook(() => useTenant(), { wrapper });

    act(() => {
      result.current.selectTenant(tenant);
    });

    expect(result.current.selectedTenant).toEqual(tenant);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'selectedTenant',
      JSON.stringify(tenant)
    );
  });

  it('should create tenant successfully', async () => {
    const newTenant = { id: 'new-tenant', name: 'New Tenant' };
    safeApiFetch.mockResolvedValueOnce(newTenant);

    const { result } = renderHook(() => useTenant(), { wrapper });

    await act(async () => {
      await result.current.createTenant('New Tenant');
    });

    expect(result.current.tenants).toContain(newTenant);
    expect(result.current.selectedTenant).toEqual(newTenant);
  });

  it('should update tenant successfully', async () => {
    const updatedTenant = { id: 'tenant-1', name: 'Updated Tenant' };
    safeApiFetch.mockResolvedValueOnce(updatedTenant);

    const { result } = renderHook(() => useTenant(), { wrapper });

    // Set initial tenants
    act(() => {
      result.current.tenants = [{ id: 'tenant-1', name: 'Original Tenant' }];
    });

    await act(async () => {
      await result.current.updateTenant('tenant-1', { name: 'Updated Tenant' });
    });

    expect(result.current.tenants[0]).toEqual(updatedTenant);
  });

  it('should delete tenant successfully', async () => {
    safeApiFetch.mockResolvedValueOnce({});

    const { result } = renderHook(() => useTenant(), { wrapper });

    // Set initial tenants
    act(() => {
      result.current.tenants = [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' },
      ];
      result.current.selectedTenant = { id: 'tenant-1', name: 'Tenant 1' };
    });

    await act(async () => {
      await result.current.deleteTenant('tenant-1');
    });

    expect(result.current.tenants).toHaveLength(1);
    expect(result.current.tenants[0].id).toBe('tenant-2');
    expect(result.current.selectedTenant).toBeNull();
  });

  it('should handle tenant creation error', async () => {
    safeApiFetch.mockRejectedValueOnce(new Error('Creation failed'));

    const { result } = renderHook(() => useTenant(), { wrapper });

    await act(async () => {
      try {
        await result.current.createTenant('New Tenant');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Creation failed');
      }
    });
  });

  it('should clear selected tenant', () => {
    const { result } = renderHook(() => useTenant(), { wrapper });

    // Set initial tenant
    act(() => {
      result.current.selectedTenant = { id: 'tenant-1', name: 'Test Tenant' };
    });

    act(() => {
      result.current.clearSelectedTenant();
    });

    expect(result.current.selectedTenant).toBeNull();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('selectedTenant');
  });
});
