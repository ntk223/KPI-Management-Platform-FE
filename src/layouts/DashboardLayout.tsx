import React, { useState } from 'react';

// Define the User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'DIRECTOR' | 'MANAGER' | 'EMPLOYEE';
  avatar?: string;
}

// Define the MenuItem interface
interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles: ('ADMIN' | 'DIRECTOR' | 'MANAGER' | 'EMPLOYEE')[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentUser?: User; // Optional mock user prop, defaults to MANAGER
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentUser = {
    id: 'user-01',
    name: 'Trần Minh Quang',
    email: 'quang.tm@kpi-corp.vn',
    role: 'MANAGER', // Try changing this to ADMIN, DIRECTOR, or EMPLOYEE to see sidebar adjust dynamically
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  },
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // System navigation items mapped with role authorization rules
  const menuItems: MenuItem[] = [
    {
      label: 'Bảng điều khiển',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
      allowedRoles: ['ADMIN', 'DIRECTOR', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'KPI Cấp Công Ty',
      path: '/kpis/company',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      allowedRoles: ['ADMIN', 'DIRECTOR'],
    },
    {
      label: 'KPI Cấp Phòng Ban',
      path: '/kpis/department',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      allowedRoles: ['ADMIN', 'DIRECTOR', 'MANAGER'],
    },
    {
      label: 'KPI Cá Nhân',
      path: '/kpis/personal',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      allowedRoles: ['ADMIN', 'DIRECTOR', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Nhật ký tiến độ',
      path: '/tracking-logs',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      allowedRoles: ['ADMIN', 'DIRECTOR', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Quản lý Tài khoản',
      path: '/users',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      allowedRoles: ['ADMIN'],
    },
    {
      label: 'Cấu hình hệ thống',
      path: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      allowedRoles: ['ADMIN'],
    },
  ];

  // Filter menu items by user's role authorization
  const filteredMenuItems = menuItems.filter((item) =>
    item.allowedRoles.includes(currentUser.role)
  );

  // Class helper mapping for role color definitions (to use extended tailwind configuration)
  const roleBadgeStyles: Record<string, string> = {
    ADMIN: 'bg-role-admin/10 text-role-admin border-role-admin/30',
    DIRECTOR: 'bg-role-director/10 text-role-director border-role-director/30',
    MANAGER: 'bg-role-manager/10 text-role-manager border-role-manager/30',
    EMPLOYEE: 'bg-role-employee/10 text-role-employee border-role-employee/30',
  };

  const activeLinkClass = "bg-blue-50 text-primary font-medium border-r-4 border-primary";
  const inactiveLinkClass = "text-secondary hover:bg-slate-50 hover:text-slate-900 border-r-4 border-transparent";

  // Mock active path (hardcoded to department KPI for manager demo)
  const currentPath = '/kpis/department';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. SIDEBAR FOR DESKTOP (FIXED LEFT) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-20 bg-white border-r border-slate-200 shadow-sm transition-all duration-300">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo Brand Header */}
          <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-slate-100 bg-gradient-to-r from-blue-900 to-indigo-900">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center font-bold text-primary shadow-sm text-lg">
                K
              </div>
              <span className="text-white font-semibold tracking-wider text-sm uppercase">KPI Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Chức năng chính
            </div>
            {filteredMenuItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <a
                  key={item.path}
                  href="#"
                  className={`flex items-center px-3 py-2.5 text-sm rounded-md transition-all duration-200 group ${
                    isActive ? activeLinkClass : inactiveLinkClass
                  }`}
                >
                  <span className={`mr-3 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Footer User Profile Summary */}
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

      {/* 2. MOBILE DRAWER SIDEBAR WITH OVERLAY */}
      <div className={`md:hidden fixed inset-0 z-40 flex transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Dark overlay backdrop */}
        <div 
          className="fixed inset-0 bg-slate-900/60 transition-opacity" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />

        {/* Sliding panel content */}
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-slate-800 text-white"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6.5 w-6.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                const isActive = currentPath === item.path;
                return (
                  <a
                    key={item.path}
                    href="#"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center px-3 py-2.5 text-base rounded-md transition-all duration-200 ${
                      isActive ? activeLinkClass : inactiveLinkClass
                    }`}
                  >
                    <span className={`mr-4 ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    {item.label}
                  </a>
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

      {/* 3. MAIN APP SECTION CONTAINER */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* FIXED HEADER */}
        <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-slate-200 shadow-sm">
          {/* Mobile hamburger toggle */}
          <button
            type="button"
            className="px-4 border-r border-slate-200 text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden hover:bg-slate-50"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Top Bar Content */}
          <div className="flex-1 px-4 sm:px-6 md:px-8 flex justify-between items-center">
            {/* Left Header - Business Cycle Selector & Info */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50/80 border border-blue-100 rounded-lg text-primary text-xs font-semibold shadow-inner">
                <svg className="w-4 h-4 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Chu kỳ: Q3-2025
              </div>
              <span className="sm:hidden text-xs font-bold text-primary px-2 py-1 bg-blue-50 rounded">Q3-2025</span>
            </div>

            {/* Right Header - Notifications, Profile Dropdown */}
            <div className="ml-4 flex items-center md:ml-6 gap-3">
              {/* Notification bell button */}
              <button 
                type="button" 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary relative transition-all duration-200"
              >
                <span className="sr-only">Xem thông báo</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white" />
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="max-w-xs flex items-center gap-2.5 p-1 rounded-full text-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
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

                {/* Dropdown Menu Overlay */}
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                    <div 
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-40 divide-y divide-slate-100"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                    >
                      <div className="px-4 py-2 text-xs text-slate-500">
                        Đang đăng nhập với vai trò:<br/>
                        <span className={`inline-block px-1.5 py-0.25 mt-1 text-[9px] font-bold rounded-full border ${roleBadgeStyles[currentUser.role]}`}>
                          {currentUser.role}
                        </span>
                      </div>
                      <div className="py-1">
                        <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">
                          Thông tin cá nhân
                        </a>
                        <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">
                          Đổi mật khẩu
                        </a>
                      </div>
                      <div className="py-1">
                        <a href="#" className="block px-4 py-2 text-sm text-danger hover:bg-red-50 font-medium" role="menuitem">
                          Đăng xuất
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY SCROLL VIEW */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            {/* Header Content Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Breadcrumbs Component */}
              <nav className="flex items-center text-xs text-slate-500 mb-4 bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2">
                  <li className="inline-flex items-center">
                    <a href="#" className="inline-flex items-center text-slate-500 hover:text-slate-800">
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Trang chủ
                    </a>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-slate-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <a href="#" className="ml-1 md:ml-2 text-slate-500 hover:text-slate-800">KPIs</a>
                    </div>
                  </li>
                  <li aria-current="page">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-slate-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-1 md:ml-2 text-slate-800 font-semibold">KPI Cấp Phòng Ban</span>
                    </div>
                  </li>
                </ol>
              </nav>
            </div>

            {/* Dashboard Content Portal children rendering */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="py-4">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
