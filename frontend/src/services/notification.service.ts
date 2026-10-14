import api from "./api";
import type { NotificationResponse, Notification } from "../types/notification";

export const notificationService = {
  getNotifications: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const res = await api.get<NotificationResponse>("/notifications", {
      params,
    });
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await api.patch<{ success: boolean; notification: Notification }>(
      `/notifications/${id}/read`
    );
    return res.data.notification;
  },
};
