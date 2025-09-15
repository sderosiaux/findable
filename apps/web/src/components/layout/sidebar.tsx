'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bot,
  Building,
  FileText,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  Target,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Projects', href: '/projects', icon: Building },
  { name: 'Queries', href: '/queries', icon: Search },
  { name: 'Metrics', href: '/metrics', icon: BarChart3 },
  { name: 'Competitors', href: '/competitors', icon: TrendingUp },
  { name: 'AI Models', href: '/models', icon: Bot },
  { name: 'Surfaces', href: '/surfaces', icon: FileText },
  { name: 'Playbooks', href: '/playbooks', icon: Target },
  { name: 'Organization', href: '/organization', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent
          navigation={navigation}
          pathname={pathname}
          collapsed={false}
          onClose={() => setMobileOpen(false)}
          showCloseButton
          user={user}
          logout={logout}
        />
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:bg-white lg:shadow-lg lg:transition-all lg:duration-300',
          collapsed ? 'lg:w-16' : 'lg:w-64',
          className
        )}
      >
        <SidebarContent
          navigation={navigation}
          pathname={pathname}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          user={user}
          logout={logout}
        />
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 left-4 z-30"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </>
  );
}

interface SidebarContentProps {
  navigation: typeof navigation;
  pathname: string;
  collapsed: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
  user: any;
  logout: () => void;
}

function SidebarContent({
  navigation,
  pathname,
  collapsed,
  onToggle,
  onClose,
  showCloseButton,
  user,
  logout,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center bg-blue-600 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Findable</span>
          </div>
        )}

        {showCloseButton && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}

        {!showCloseButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(collapsed && 'w-full')}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                  collapsed && 'mr-0'
                )}
                aria-hidden="true"
              />
              {!collapsed && item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && user && (
        <div className="flex-shrink-0 border-t p-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      )}

      {/* Collapsed user footer */}
      {collapsed && user && (
        <div className="flex-shrink-0 border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full p-2"
            onClick={logout}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}