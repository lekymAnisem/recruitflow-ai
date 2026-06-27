import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '@/store/authStore';

interface HeaderProps {
  onMenuToggle: () => void;
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Jobs',
  '/candidates': 'Candidates',
  '/tags': 'Tags',
  '/settings': 'Settings',
};

export function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const { user } = useAuth();

  const title = routeTitles[location.pathname] || 'RecruitFlow AI';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:px-8">
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-medium text-white">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden text-sm sm:block">
            <p className="font-medium text-gray-900">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role || 'Recruiter'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
