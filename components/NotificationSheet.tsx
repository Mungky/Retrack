"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  AlertTriangle,
  Calendar,
  Trophy,
  Info,
  CheckCircle,
  Trash2,
  Inbox,
} from "lucide-react";
import { useSheet } from "@/contexts/SheetContext";
import { Z_INDEX } from "@/lib/z-index";
import { TOAST_MESSAGES } from "@/lib/toast-messages";
import { useToast } from "@/contexts/ToastContext";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/app/actions/notifications";
import { formatRelativeTime } from "@/lib/relative-time";
import type { Notification } from "@/types";

export type NotificationPriority = "alert" | "reminder" | "achievement" | "system";

export interface NotificationItemData {
  id: string;
  title: string;
  description: string;
  time: string;
  type: NotificationPriority;
  read: boolean;
}

/** Map DB type to UI type */
function dbTypeToUiType(dbType: Notification["type"]): NotificationPriority {
  const map: Record<Notification["type"], NotificationPriority> = {
    alert: "alert",
    info: "system",
    success: "achievement",
    reminder: "reminder",
  };
  return map[dbType];
}

function notificationToItem(n: Notification): NotificationItemData {
  return {
    id: n.id,
    title: n.title,
    description: n.message ?? "",
    time: formatRelativeTime(n.created_at),
    type: dbTypeToUiType(n.type),
    read: n.is_read,
  };
}

const ICON_MAP: Record<NotificationPriority, typeof AlertTriangle> = {
  alert: AlertTriangle,
  reminder: Calendar,
  achievement: Trophy,
  system: Info,
};

const PRIORITY_STYLES: Record<
  NotificationPriority,
  { border: string; iconBg: string; iconColor: string; dotColor: string }
> = {
  alert: {
    border: "border-l-4 border-l-rose-500",
    iconBg: "bg-rose-500/20",
    iconColor: "text-rose-400",
    dotColor: "bg-rose-500",
  },
  reminder: {
    border: "border-l-4 border-l-blue-500",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    dotColor: "bg-blue-500",
  },
  achievement: {
    border: "border-l-4 border-l-emerald-500",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    dotColor: "bg-amber-500",
  },
  system: {
    border: "border-l-4 border-l-slate-400",
    iconBg: "bg-slate-500/20",
    iconColor: "text-slate-400",
    dotColor: "bg-amber-500",
  },
};

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (hasUnread: boolean) => void;
}

export default function NotificationSheet({
  isOpen,
  onClose,
  onUnreadChange,
}: NotificationSheetProps) {
  const { setIsSheetOpen } = useSheet();
  const { showToast } = useToast();
  const [items, setItems] = useState<NotificationItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSheetOpen(isOpen);
    return () => {
      setIsSheetOpen(false);
    };
  }, [isOpen, setIsSheetOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getNotifications()
        .then((res) => {
          if (res.success && res.data) {
            setItems(res.data.map(notificationToItem));
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const hasUnread = items.some((i) => !i.read);
  const isEmpty = items.length === 0;

  const syncUnread = useCallback(() => {
    onUnreadChange?.(items.some((i) => !i.read));
  }, [items, onUnreadChange]);

  useEffect(() => {
    syncUnread();
  }, [items, syncUnread]);

  const handleMarkRead = async (id: string) => {
    const prev = items;
    setItems((p) => p.map((i) => (i.id === id ? { ...i, read: true } : i)));
    const res = await markNotificationRead(id);
    if (!res.success) {
      setItems(prev);
      showToast(res.error ?? TOAST_MESSAGES.ERROR.FAILED_TO_UPDATE, "error");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    showToast(TOAST_MESSAGES.SUCCESS.NOTIFICATION_REMOVED, "success");
    const res = await deleteNotification(id);
    if (!res.success) {
      setItems(prev);
      showToast(res.error ?? TOAST_MESSAGES.ERROR.FAILED_TO_DELETE, "error");
    }
  };

  const handleMarkAllRead = async () => {
    const prev = items;
    setItems((p) => p.map((i) => ({ ...i, read: true })));
    showToast(TOAST_MESSAGES.SUCCESS.ALL_CAUGHT_UP, "success");
    const res = await markAllNotificationsRead();
    if (!res.success) {
      setItems(prev);
      showToast(res.error ?? TOAST_MESSAGES.ERROR.FAILED_TO_UPDATE, "error");
    }
  };

  const handleClearAll = async () => {
    const prev = items;
    setItems([]);
    showToast(TOAST_MESSAGES.SUCCESS.ALL_NOTIFICATIONS_CLEARED, "success");
    const res = await clearAllNotifications();
    if (!res.success) {
      setItems(prev);
      showToast(res.error ?? TOAST_MESSAGES.ERROR.FAILED_TO_CLEAR, "error");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity duration-300 backdrop-blur-sm"
        style={{ zIndex: Z_INDEX.backdrop }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 animate-in" style={{ zIndex: Z_INDEX.sheet }}>
        <div
          className="sheet-panel mx-auto max-w-2xl max-h-[85vh] rounded-t-3xl rounded-b-none overflow-hidden sheet-bg-dark border-t border-x border-border shadow-2xl backdrop-blur-xl flex flex-col"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <h2 className="text-xl font-bold text-white">Financial Highlights</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="text-white/60" size={20} />
            </button>
          </div>

          {/* Scrollable list or empty state */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
            style={{
              maxHeight: "calc(70vh - 220px)",
            }}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm mt-3">Loading notifications…</p>
              </div>
            ) : isEmpty ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Inbox className="text-zinc-500" size={32} />
                </div>
                <p className="text-zinc-400 font-medium mb-1">No notifications</p>
                <p className="text-zinc-500 text-sm">
                  You&apos;re all caught up. Check back later!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const style = PRIORITY_STYLES[item.type];
                  const Icon = ICON_MAP[item.type];
                  const isUnread = !item.read;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleMarkRead(item.id)}
                      className={`rounded-2xl border border-white/10 p-4 flex gap-4 cursor-pointer transition-colors ${
                        isUnread
                          ? "bg-zinc-800/50 hover:bg-zinc-800/70 border-l-4"
                          : "bg-transparent hover:bg-white/[0.03]"
                      } ${isUnread ? style.border : "border-l-4 border-l-transparent"}`}
                    >
                      <div className="flex gap-4 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center`}
                          >
                            <Icon
                              className={isUnread ? style.iconColor : "text-zinc-500"}
                              size={20}
                            />
                          </div>
                          {isUnread && (
                            <span
                              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${style.dotColor}`}
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`text-sm mb-1 ${
                              isUnread ? "text-zinc-100 font-medium" : "text-zinc-500"
                            }`}
                          >
                            {item.title}
                          </h3>
                          <p
                            className={`text-xs leading-relaxed ${
                              isUnread ? "text-zinc-400" : "text-zinc-500"
                            }`}
                          >
                            {item.description}
                          </p>
                          <p className="text-zinc-500 text-xs mt-2">{item.time}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="flex-shrink-0 p-2 rounded-xl hover:bg-white/10 hover:text-red-500 text-zinc-500 transition-colors self-start"
                        aria-label="Delete notification"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div
            className="flex-shrink-0 px-4 py-4 border-t border-white/10 sheet-bg-dark backdrop-blur-xl"
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            {isEmpty ? (
              <div className="flex items-center justify-center gap-2 py-3 text-emerald-400/80 text-sm font-medium">
                <CheckCircle size={18} />
                All caught up!
              </div>
            ) : (
              <div className="flex gap-2">
                {hasUnread && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white/80 font-medium text-sm transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className={`py-3 rounded-2xl border border-white/10 text-white/60 hover:text-red-400 hover:border-red-500/30 font-medium text-sm transition-colors ${
                    hasUnread ? "px-4" : "flex-1"
                  }`}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
