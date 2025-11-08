import { supabase } from "@/integrations/supabase/client";

export interface NotificationData {
  title: string;
  message: string;
  type: string;
  user_id: string;
  related_id?: string;
}

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface ApplicationDecisionEmailPayload {
  email: string;
  applicantName?: string | null;
  status: "approved" | "rejected";
  opportunityTitle: string;
}

/**
 * Creates an in-app notification in the database
 */
export async function createNotification(notificationData: NotificationData) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        user_id: notificationData.user_id,
        related_id: notificationData.related_id,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

/**
 * Creates application status notification
 */
export async function createApplicationStatusNotification(
  userId: string,
  applicationId: string,
  status: "approved" | "rejected",
  opportunityTitle: string
) {
  const isApproved = status === "approved";

  const notificationData: NotificationData = {
    title: isApproved ? "🎉 Application Approved!" : "Application Update",
    message: isApproved
      ? `Congratulations! Your application for "${opportunityTitle}" has been approved. Check your dashboard for next steps.`
      : `Your application for "${opportunityTitle}" was not selected this time. Don't worry, keep applying to other opportunities!`,
    type: `application_${status}`,
    user_id: userId,
    related_id: applicationId,
  };

  const notification = await createNotification(notificationData);

  // Send push notification if available
  await sendPushNotification(userId, {
    title: notificationData.title,
    body: notificationData.message,
    data: {
      type: notificationData.type,
      related_id: applicationId,
    },
  });

  return notification;
}

/**
 * Sends push notification to mobile app
 * This is a placeholder for push notification service integration
 */
export async function sendPushNotification(
  userId: string,
  pushData: PushNotificationData
) {
  try {
    // TODO: Implement push notification service integration
    // This could be Firebase FCM, Expo Notifications, or another service

    // For now, we'll just log the notification
    console.log("Push notification would be sent:", {
      userId,
      ...pushData,
    });

    return { success: true, message: "Push notification logged" };
  } catch (error) {
    console.error("Failed to send push notification:", error);
    // Don't throw error here as push notifications are not critical
    return { success: false, error };
  }
}

/**
 * Requests an application decision email via the internal API route
 */
export async function triggerApplicationDecisionEmail(
  payload: ApplicationDecisionEmailPayload
) {
  if (!payload.email) return;

  try {
    if (typeof window === "undefined") {
      console.warn(
        "triggerApplicationDecisionEmail should be executed from the client runtime; skipping request."
      );
      return;
    }

    const response = await fetch("/api/notifications/application-decision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Application decision email request failed:",
        response.status,
        errorText
      );
    }
  } catch (error) {
    console.error("Error triggering application decision email:", error);
  }
}

/**
 * Gets user's unread notifications
 */
export async function getUserNotifications(userId: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    throw error;
  }
}

/**
 * Marks a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Gets unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
}
