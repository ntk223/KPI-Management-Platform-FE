import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth';
import * as Icon from '../components/icons';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { Client } from '@stomp/stompjs';
import { notificationService, NotificationItem } from '../services/notificationService';
import { useToast } from '../context';

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

const getWebSocketUrl = () => {
  // return "ws://localhost:8888/ws-kpi/websocket";
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888/api';
  if (apiBaseUrl.startsWith('http')) {
    const url = new URL(apiBaseUrl);
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const path = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
    return `${wsProtocol}//${url.host}${path}/ws-kpi/websocket`;

  } else {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}/api/ws-kpi/websocket`;
  }
};

const formatTimeAgo = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { info: toastInfo } = useToast();

  const currentUser = {
    name: user?.fullName || 'Khách',
    email: user?.email || 'guest@kpi-corp.vn',
    role: user?.role || 'EMPLOYEE',
    employeeId: user?.employeeId,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  };

  useEffect(() => {
    if (!currentUser.employeeId) return;

    // Fetch initial notifications
    notificationService.getNotifications(currentUser.employeeId, 0, 20)
      .then(res => setNotifications(res.content))
      .catch(err => console.error("Error fetching notifications", err));

    // Fetch unread count
    notificationService.getUnreadCount(currentUser.employeeId)
      .then(res => setUnreadCount(res))
      .catch(err => console.error("Error fetching unread count", err));

    // Connect to WebSocket via STOMP
    const wsUrl = getWebSocketUrl();
    const stompClient = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe(`/queue/notifications/${currentUser.employeeId}`, (message) => {
          try {
            const notif: NotificationItem = JSON.parse(message.body);
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);
            toastInfo(notif.message);
          } catch (e) {
            console.error('Failed to parse notification message', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      }
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [currentUser.employeeId]);

  const handleMarkAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.isRead);
    if (unreadNotifs.length === 0) return;
    try {
      await Promise.all(unreadNotifs.map(n => notificationService.markAsRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleNotifClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }

    // Close the dropdown
    setIsNotifOpen(false);

    // Route to the relevant section
    if (notif.actionType === 'KPI_SUBMITTED') {
      navigate('/kpis/evaluation');
    } else if (notif.actionType === 'KPI_APPROVED' || notif.actionType === 'KPI_REJECTED') {
      if (currentUser.role === 'EMPLOYEE' || currentUser.role === 'MANAGER') {
        navigate('/kpis/personal');
      } else if (currentUser.role === 'DIRECTOR') {
        navigate('/kpis/evaluation');
      } else {
        navigate('/dashboard');
      }
    } else if (notif.actionType === 'KPI_ASSIGNED') {
      navigate('/kpis/personal');
    } else {
      navigate('/dashboard');
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'KPI_SUBMITTED':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-500 dark:bg-amber-950/50 dark:text-amber-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
        );
      case 'KPI_APPROVED':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'KPI_REJECTED':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'KPI_ASSIGNED':
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
    }
  };

  // Redirect to dashboard by default if at root
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const menuItems: MenuItem[] = currentUser.role === 'ADMIN' ? [
    {
      label: 'Bảng điều khiển',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
      allowedRoles: ['ADMIN'],
    },
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
      label: 'Đánh giá KPI',
      path: '/kpis/evaluation',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      allowedRoles: ['DIRECTOR', 'MANAGER'],
    },
    {
      label: 'Nhật ký tiến độ',
      path: '/tracking-logs',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      allowedRoles: ['MANAGER', 'EMPLOYEE'],
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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-20 bg-white border-r border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-slate-100 bg-gradient-to-r from-zinc-900 to-indigo-900 dark:from-zinc-950 dark:to-indigo-950 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center font-bold text-primary shadow-sm text-lg">
                K
              </div>
              <span className="text-white font-semibold tracking-wider text-sm uppercase">KPI Portal</span>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider dark:text-zinc-500">
              {currentUser.role === 'ADMIN' ? 'Quản trị Hệ thống' : 'Chức năng chính'}
            </div>
            {filteredMenuItems.map((item) => {
              const searchParams = new URLSearchParams(location.search);
              const activeTab = searchParams.get('tab') || 'positions';
              const isActive = currentUser.role === 'ADMIN'
                ? (item.path === '/dashboard' ? location.pathname === '/dashboard' : (location.pathname.startsWith('/admin/catalog') && activeTab === item.tabId))
                : (location.pathname === item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                    }`}
                >
                  <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-zinc-500'
                    }`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <img
                className="w-9 h-9 rounded-full border border-slate-200 dark:border-zinc-700 object-cover flex-shrink-0"
                src={currentUser.avatar}
                alt={currentUser.name}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate leading-tight">{currentUser.name}</p>
                <span className={`inline-flex items-center mt-0.5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${roleBadgeStyles[currentUser.role]}`}>
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
                  ? (item.path === '/dashboard' ? location.pathname === '/dashboard' : (location.pathname.startsWith('/admin/catalog') && activeTab === item.tabId))
                  : (location.pathname === item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center px-3 py-2.5 text-base rounded-md transition-all duration-200 ${isActive ? activeLinkClass : inactiveLinkClass
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
        <header className="sticky top-0 z-50 flex-shrink-0 flex h-16 bg-white border-b border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <button
            type="button"
            className="px-4 border-r border-slate-200 text-slate-500 md:hidden hover:bg-slate-50"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 px-4 sm:px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 text-xs font-semibold dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300">
                Chu kỳ: Q3-2025
              </div>
              <span className="sm:hidden text-xs font-bold text-indigo-700 dark:text-indigo-400 px-2 py-1 bg-indigo-50 dark:bg-indigo-950/50 rounded">Q3-2025</span>
            </div>

            <div className="ml-4 flex items-center gap-2">
              <ThemeSwitcher />

              {/* Notification Bell and Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-200"
                >
                  <svg className="w-6 h-6 text-slate-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-4 w-4 rounded-full ring-2 ring-white bg-rose-500 text-[10px] font-bold text-white text-center leading-4 dark:ring-zinc-900">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsNotifOpen(false)} />
                    <div className="origin-top-right absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-xl py-2 bg-white ring-1 ring-black/5 z-40 dark:bg-zinc-900 dark:ring-zinc-850 border border-slate-100 dark:border-zinc-800">
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Thông báo</h3>
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                            {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                          >
                            Đọc tất cả
                          </button>
                        )}
                      </div>

                      <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                            Không có thông báo nào.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={`flex gap-3 px-4 py-3 cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-zinc-800/50 ${!notif.isRead ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                                }`}
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotifIcon(notif.actionType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs text-slate-750 dark:text-zinc-300 leading-normal ${!notif.isRead ? 'font-semibold' : 'font-medium'
                                  }`}>
                                  {notif.message}
                                </p>
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-1">
                                  {formatTimeAgo(notif.createdAt)}
                                </span>
                              </div>
                              {!notif.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-2.5 flex-shrink-0" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-200"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <img
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-zinc-700 flex-shrink-0"
                    src={currentUser.avatar}
                    alt={currentUser.name}
                  />
                  <span className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 leading-tight">{currentUser.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium leading-none mt-0.5">{currentUser.email}</span>
                  </span>
                  <svg className="hidden lg:block h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                    <div className="origin-top-right absolute right-0 mt-2 w-52 rounded-xl shadow-lg py-1 bg-white ring-1 ring-black/5 z-40 divide-y divide-slate-100 dark:bg-zinc-800 dark:ring-zinc-700 dark:divide-zinc-700">
                      <div className="px-4 py-2.5 text-xs text-slate-500 dark:text-zinc-400">
                        Đang truy cập:<br />
                        <span className={`inline-block px-1.5 py-0.5 mt-1 text-[10px] font-bold rounded border ${roleBadgeStyles[currentUser.role]}`}>
                          {currentUser.role}
                        </span>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/profile');
                          }}
                          className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-700/60 font-medium"
                        >
                          <Icon.User className="w-4 h-4 text-slate-400" />
                          Hồ sơ cá nhân
                        </button>
                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:text-rose-450 font-medium">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
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
        <main className="flex-1 overflow-y-auto focus:outline-none bg-slate-50 dark:bg-zinc-950">
          <div className="py-6 px-4 sm:px-6 md:px-8">
            <div className="max-w-7xl mx-auto">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
