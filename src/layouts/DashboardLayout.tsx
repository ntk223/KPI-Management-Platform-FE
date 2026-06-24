import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth';
import * as Icon from '../components/icons';

// Define the MenuItem interface
interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles: ('ADMIN' | 'DIRECTOR' | 'MANAGER' | 'EMPLOYEE')[];
  tabId?: string;
}

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const currentUser = {
    name: user?.fullName || 'Khách',
    email: user?.email || 'guest@kpi-corp.vn',
    role: user?.role || 'EMPLOYEE',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  };

  // Automatically redirect ADMIN to the catalog page when entering the system
  useEffect(() => {
    if (currentUser.role === 'ADMIN' && (location.pathname === '/' || location.pathname === '/dashboard' || location.pathname === '/profile')) {
      navigate('/admin/catalog?tab=positions', { replace: true });
    }
  }, [currentUser.role, location.pathname, navigate]);

  const menuItems: MenuItem[] = currentUser.role === 'ADMIN' ? [
    {
      label: 'Chức vụ',
      path: '/admin/catalog?tab=positions',
      tabId: 'positions',
      icon: <Icon.Medal className="w-5 h-5" />,
      allowedRoles: ['ADMIN'],
    },
    {
      label: 'Phòng ban',
      path: '/admin/catalog?tab=departments',
      tabId: 'departments',
      icon: <Icon.Building className="w-5 h-5" />,
      allowedRoles: ['ADMIN'],
    },
    {
      label: 'Nhân viên',
      path: '/admin/catalog?tab=employees',
      tabId: 'employees',
      icon: <Icon.Users className="w-5 h-5" />,
      allowedRoles: ['ADMIN'],
    },
    {
      label: 'Chu kỳ KPI',
      path: '/admin/catalog?tab=cycles',
      tabId: 'cycles',
      icon: <Icon.Calendar className="w-5 h-5" />,
      allowedRoles: ['ADMIN'],
    },
    {
      label: 'Danh mục',
      path: '/admin/catalog?tab=categories',
      tabId: 'categories',
      icon: <Icon.FolderOpen className="w-5 h-5" />,
      allowedRoles: ['ADMIN'],
    },
    {
      label: 'Tiêu chí mẫu',
      path: '/admin/catalog?tab=templates',
      tabId: 'templates',
      icon: <Icon.ClipboardList className="w-5 h-5" />,
      allowedRoles: ['ADMIN'],
    },
    {
      label: 'Tài khoản',
      path: '/admin/catalog?tab=accounts',
      tabId: 'accounts',
      icon: <Icon.User className="w-5 h-5" />,
      allowedRoles: ['ADMIN'],
    },
  ] : [
    {
      label: 'Bảng điều khiển',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
      allowedRoles: ['DIRECTOR', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'KPI Cấp Công Ty',
      path: '/kpis/company',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      allowedRoles: ['DIRECTOR'],
    },
    {
      label: 'Tổ chức Phòng ban',
      path: '/org',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4a2 2 0 012 2v2H3V7zm6 0h6a2 2 0 012 2v2h-8V7zm4 6a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2h-4a2 2 0 01-2-2v-6zM3 13a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6z" />
        </svg>
      ),
      allowedRoles: ['DIRECTOR'],
    },
    {
      label: 'KPI Cấp Phòng Ban',
      path: '/kpis/department',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      allowedRoles: ['MANAGER'],
    },
    {
      label: 'Nhân sự Phòng ban',
      path: '/team',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      allowedRoles: ['MANAGER'],
    },
    {
      label: 'KPI Cá Nhân',
      path: '/kpis/personal',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      allowedRoles: ['MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Nhật ký tiến độ',
      path: '/tracking-logs',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      allowedRoles: ['DIRECTOR', 'MANAGER', 'EMPLOYEE'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.allowedRoles.includes(currentUser.role)
  );

  const roleBadgeStyles: Record<string, string> = {
    ADMIN: 'bg-role-admin/10 text-role-admin border-role-admin/30',
    DIRECTOR: 'bg-role-director/10 text-role-director border-role-director/30',
    MANAGER: 'bg-role-manager/10 text-role-manager border-role-manager/30',
    EMPLOYEE: 'bg-role-employee/10 text-role-employee border-role-employee/30',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileSidebarOpen(false);
  };

  const activeLinkClass = "bg-blue-50 text-primary font-bold border-r-4 border-primary";
  const inactiveLinkClass = "text-secondary hover:bg-slate-50 hover:text-slate-900 border-r-4 border-transparent";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-20 bg-white border-r border-slate-200 shadow-sm">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-slate-100 bg-gradient-to-r from-blue-900 to-indigo-900">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center font-bold text-primary shadow-sm text-lg">
                K
              </div>
              <span className="text-white font-semibold tracking-wider text-sm uppercase">KPI Portal</span>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {currentUser.role === 'ADMIN' ? 'Quản lý Danh mục' : 'Chức năng chính'}
            </div>
            {filteredMenuItems.map((item) => {
              const searchParams = new URLSearchParams(location.search);
              const activeTab = searchParams.get('tab') || 'positions';
              const isActive = currentUser.role === 'ADMIN'
                ? (location.pathname.startsWith('/admin/catalog') && activeTab === item.tabId)
                : (location.pathname === item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-all duration-200 group ${
                    isActive ? activeLinkClass : inactiveLinkClass
                  }`}
                >
                  <span className={`mr-3 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <img
                className="h-10 w-10 rounded-full border-2 border-white shadow-sm object-cover"
                src={currentUser.avatar}
                alt={currentUser.name}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{currentUser.name}</p>
                <span className={`inline-block px-1.5 py-0.25 mt-0.5 text-[9px] font-bold rounded-full border ${roleBadgeStyles[currentUser.role]}`}>
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      <div className={`md:hidden fixed inset-0 z-40 flex transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-slate-900/60 transition-opacity" onClick={() => setIsMobileSidebarOpen(false)} />

        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-slate-800 text-white"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4 gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-md text-lg">
                K
              </div>
              <span className="text-slate-800 font-bold tracking-wide text-md">KPI PORTAL</span>
            </div>
            <nav className="px-2 space-y-1">
              {filteredMenuItems.map((item) => {
                const searchParams = new URLSearchParams(location.search);
                const activeTab = searchParams.get('tab') || 'positions';
                const isActive = currentUser.role === 'ADMIN'
                  ? (location.pathname.startsWith('/admin/catalog') && activeTab === item.tabId)
                  : (location.pathname === item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center px-3 py-2.5 text-base rounded-md transition-all duration-200 ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`}
                  >
                    <span className={`mr-4 ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex-shrink-0 flex border-t border-slate-200 p-4 bg-slate-50">
            <div className="flex items-center gap-3">
              <img
                className="inline-block h-10 w-10 rounded-full object-cover"
                src={currentUser.avatar}
                alt={currentUser.name}
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">{currentUser.name}</p>
                <span className={`inline-block px-1.5 py-0.25 text-[9px] font-bold rounded-full border ${roleBadgeStyles[currentUser.role]}`}>
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <header className="sticky top-0 z-50 flex-shrink-0 flex h-16 bg-white border-b border-slate-200 shadow-sm">
          <button
            type="button"
            className="px-4 border-r border-slate-200 text-slate-500 md:hidden hover:bg-slate-50"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 px-4 sm:px-6 md:px-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50/80 border border-blue-100 rounded-lg text-primary text-xs font-semibold shadow-inner">
                Chu kỳ: Q3-2025
              </div>
              <span className="sm:hidden text-xs font-bold text-primary px-2 py-1 bg-blue-50 rounded">Q3-2025</span>
            </div>

            <div className="ml-4 flex items-center gap-3">
              {/* Profile dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="max-w-xs flex items-center gap-2.5 p-1 rounded-full text-sm hover:bg-slate-100 transition-all duration-200"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <img
                    className="h-8.5 w-8.5 rounded-full object-cover border border-slate-200"
                    src={currentUser.avatar}
                    alt={currentUser.name}
                  />
                  <span className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-700 leading-tight">{currentUser.name}</span>
                    <span className="text-[10px] text-slate-500 font-medium leading-none">{currentUser.email}</span>
                  </span>
                  <svg className="hidden lg:block h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-40 divide-y divide-slate-100">
                      <div className="px-4 py-2 text-xs text-slate-500">
                        Đang truy cập:<br/>
                        <span className={`inline-block px-1.5 py-0.25 mt-1 text-[9px] font-bold rounded-full border ${roleBadgeStyles[currentUser.role]}`}>
                          {currentUser.role}
                        </span>
                      </div>
                      <div className="py-1">
                        <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-danger hover:bg-red-50 font-medium">
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main viewport */}
        <main className="flex-1 overflow-y-auto focus:outline-none bg-slate-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Render child routes via Outlet if children is not provided */}
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
