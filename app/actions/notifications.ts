"use server";

import { createClient } from "@/lib/supabase-server";
import { getServerUserId } from "@/lib/auth-helpers";
import type { Notification } from "@/types";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

/**
 * Lightweight check for unread count. Uses count + head:true to avoid downloading data.
 * Returns 0 on auth failure or error.
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const userId = await getServerUserId();
    if (!userId) return 0;

    const supabase = await createClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    console.error("Error in getUnreadCount:", err);
    return 0;
  }
}

export async function getNotifications(): Promise<ActionResult<Notification[]>> {
  try {
    const userId = await getServerUserId();
    if (!userId) return { success: true, data: [] };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as Notification[]) || [] };
  } catch (err) {
    console.error("Error in getNotifications:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch notifications",
    };
  }
}

export async function markNotificationRead(
  id: string
): Promise<ActionResult> {
  try {
    const userId = await getServerUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error marking notification read:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in markNotificationRead:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update",
    };
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const userId = await getServerUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all notifications read:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in markAllNotificationsRead:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update",
    };
  }
}

export async function deleteNotification(id: string): Promise<ActionResult> {
  try {
    const userId = await getServerUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in deleteNotification:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete",
    };
  }
}

export async function clearAllNotifications(): Promise<ActionResult> {
  try {
    const userId = await getServerUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error clearing notifications:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in clearAllNotifications:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to clear",
    };
  }
}
