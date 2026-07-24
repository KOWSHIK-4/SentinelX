import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64 pt-16">
        <div className="container py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
