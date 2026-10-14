export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  dataJson?: {
    keyHighlight?: string;
    weekKey?: string;
    anomaliesCount?: number;
    burnRate?: Array<{
      categoryName: string;
      budget: number;
      spent: number;
      remaining: number;
      status: string;
    }>;
  };
  weekKey: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
}
