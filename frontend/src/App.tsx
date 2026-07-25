import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Landing } from '@/pages/Landing';
import { Dashboard } from '@/pages/Dashboard';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { NotFound } from '@/pages/NotFound';
import { ErrorPage } from '@/pages/ErrorPage';
import { Incidents } from '@/pages/Incidents';
import { Assets } from '@/pages/Assets';
import { Analytics } from '@/pages/Analytics';
import { Notifications } from '@/pages/Notifications';
import { Reports } from '@/pages/Reports';
import { Team } from '@/pages/Team';
import { Settings } from '@/pages/Settings';
import { Audit } from '@/pages/Audit';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const queryClient = new QueryClient();

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="sentinelx-theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute />}>
              <Route element={<AppLayout />} errorElement={<ErrorPage />}>
                <Route index element={<Dashboard />} />
                <Route path="incidents" element={<Incidents />} />
                <Route path="assets" element={<Assets />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="reports" element={<Reports />} />
                <Route path="team" element={<Team />} />
                <Route path="settings" element={<Settings />} />
                <Route path="audit" element={<Audit />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
