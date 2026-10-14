import { useEffect, useState } from "react";
import { Bell, Sparkles, Check, ChevronDown, ChevronUp } from "lucide-react";
import { notificationService } from "../../services/notification.service";
import type { Notification } from "../../types/notification";

export const NotificationCard = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications({ limit: 5 });
      setNotifications(res.notifications || []);
      setUnreadCount(res.pagination?.unreadCount || 0);
    } catch {
      // Non-blocking for dashboard
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  const latest = notifications[0];
  const isUnread = !latest.readAt;

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between border-b border-stone-100 bg-gradient-to-r from-orange-50/50 to-amber-50/30 px-5 py-3.5 dark:border-stone-800 dark:from-stone-900 dark:to-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-sm shadow-orange-600/20">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-stone-900 dark:text-white">
                AI Proactive Intelligence
              </h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-950/60 dark:text-orange-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Weekly automated financial standing & budget pacing
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          aria-label={isOpen ? "Collapse notifications" : "Expand notifications"}
        >
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isOpen && (
        <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
          {notifications.map((n) => {
            const unread = !n.readAt;
            return (
              <div
                key={n.id}
                className={`p-4 transition-colors ${
                  unread
                    ? "bg-orange-50/20 dark:bg-orange-950/10"
                    : "bg-white dark:bg-stone-900"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-900 dark:text-white">
                        {n.title}
                      </span>
                      <span className="text-xs text-stone-400 dark:text-stone-500">
                        {new Date(n.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                      {n.body}
                    </p>
                    {n.dataJson?.keyHighlight && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                        <Bell size={12} className="text-orange-600" />
                        {n.dataJson.keyHighlight}
                      </div>
                    )}
                  </div>
                  {unread && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                    >
                      <Check size={12} />
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
