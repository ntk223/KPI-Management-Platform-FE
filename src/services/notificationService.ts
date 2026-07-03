import apiClient from './apiClient';

export interface NotificationItem {
  id: number;
  userId: number;
  actorId: number | null;
  documentId: number | null;
  actionType: 'KPI_SUBMITTED' | 'KPI_APPROVED' | 'KPI_REJECTED' | 'KPI_ASSIGNED';
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
}

export const notificationService = {
  getNotifications: async (employeeId: number, page = 0, size = 10): Promise<PageResponse<NotificationItem>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<NotificationItem>>>('/notifications', {
      params: { employeeId, page, size, sort: 'createdAt,desc' },
    });
    return response.data.data;
  },

  getUnreadCount: async (employeeId: number): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>('/notifications/unread-count', {
      params: { employeeId },
    });
    return response.data.data;
  },

  markAsRead: async (id: number): Promise<NotificationItem> => {
    const response = await apiClient.put<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
    return response.data.data;
  },
};
