import { motion } from 'framer-motion';
import { Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function PendingApproval() {
  useDocumentTitle('Account Pending Approval');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-amber-500/10 p-4">
            <Clock className="h-12 w-12 text-amber-500" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Account Pending Approval</h1>
        <p className="text-muted-foreground mb-2">
          Hi{user?.firstName ? ` ${user.firstName}` : ''}, your account has been registered and is awaiting administrator approval.
        </p>
        <p className="text-muted-foreground mb-8">
          You will receive access to the system once an administrator reviews and assigns you a role. Please check back later or contact your system administrator.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
