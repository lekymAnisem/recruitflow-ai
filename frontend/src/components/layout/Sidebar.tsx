import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Tags,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/store/authStore';
import type { ReactNode } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Jobs',
    href: '/jobs',
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    label: 'Candidates',
    href: '/candidates',
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Tags',
    href: '/tags',
    icon: <Tags className="h-5 w-5" />,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 text-white transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold">
              RF
            </div>
            <span className="text-lg font-semibold">RecruitFlow AI</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <button
                key={item.href}
                onClick={() => {
                  navigate(item.href);
                  onClose();
                }}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-sm font-medium text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || 'User'}
              </p>
              <p className="truncate text-xs text-gray-400">
                {user?.role || 'Recruiter'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
