import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Dashboard } from '@/pages/Dashboard';
import { useAuthStore } from '@/store/authStore';

vi.mock('@/lib/api', () => {
  const mockIncident = { id: '1', title: 'Test Incident', severity: 'HIGH', status: 'OPEN', createdAt: '2024-01-01T00:00:00Z', createdBy: { firstName: 'Test', lastName: 'User' }, description: 'Test', updatedAt: '2024-01-01T00:00:00Z', assignedTo: null, assignedUser: null, createdById: '1' };
  return {
    incidentApi: {
      getDashboardStats: () => Promise.resolve({
        success: true,
        data: {
          totalIncidents: 10,
          openIncidents: 5,
          inProgressIncidents: 2,
          resolvedIncidents: 3,
          criticalIncidents: 2,
          highIncidents: 3,
          recentIncidents: [mockIncident],
        },
      }),
    },
    assetApi: {
      getDashboardStats: () => Promise.resolve({
        success: true,
        data: {
          totalAssets: 20,
          activeAssets: 15,
          maintenanceAssets: 3,
          retiredAssets: 2,
          criticalAssets: 4,
          highAssets: 5,
          recentAssets: [],
        },
      }),
    },
    notificationApi: {
      list: () => Promise.resolve({ success: true, data: [] }),
    },
    auditApi: {
      list: () => Promise.resolve({ success: true, data: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } }),
    },
    api: vi.fn(),
    authApi: {},
  };
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider defaultTheme="dark" storageKey="test-theme">
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          {ui}
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  });

  it('should render dashboard title', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('SOC Dashboard')).toBeInTheDocument();
  });

  it('should display stat cards with data', async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Total Incidents')).toBeInTheDocument();
      expect(screen.getAllByText('Open Incidents').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Resolved').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Critical').length).toBe(2);
    });
  });

  it('should show recent incidents', async () => {
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getAllByText('Test Incident').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should show incident overview section', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Incident Overview')).toBeInTheDocument();
  });
});
