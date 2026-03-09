import cron from "node-cron";
import { DateTime } from "luxon";
import { User, UserNotification, UserSettings } from "../Models";
import { io } from "../server";

const TZ = "Asia/Tashkent";

function mapNotificationColor(type: string) {
  switch (type) {
    case "danger":
      return "red";
    case "warning":
      return "yellow";
    case "success":
      return "green";
    default:
      return "blue";
  }
}

export function startDailyReportNotifier() {
  cron.schedule(
    "0 21 * * *",
    async () => {
      try {
        const now = DateTime.now().setZone(TZ);
        const reportDate = now.toISODate();

        const users = await User.findAll({
          attributes: ["id"],
        });

        const userIds = users.map((u: any) => u.id);

        const settings = await UserSettings.findAll({
          where: {
            user_id: userIds,
            daily_report: true,
          },
          attributes: ["user_id"],
        });

        const enabledUserIds = new Set(settings.map((s: any) => s.user_id));

        const notificationsPayload = users
          .filter((u: any) => enabledUserIds.has(u.id))
          .map((user: any) => ({
            user_id: user.id,
            title: "Kunlik hisobot tayyor",
            message: "Bugungi hisobotni ko'rish uchun bosing",
            type: "info",
            is_read: false,
            event_key: "daily_report",
            event_unique_key: `daily_report:${reportDate}:${user.id}`,
            meta: {
              report_type: "daily",
              report_date: reportDate,
            },
          }));

        const createdNotifications =
          notificationsPayload.length > 0
            ? await UserNotification.bulkCreate(notificationsPayload, {
                returning: true,
              })
            : [];

        if (io && createdNotifications.length > 0) {
          for (const notification of createdNotifications as any[]) {
            io.to(`user:${notification.user_id}`).emit("new-notification", {
              id: notification.id,
              user_id: notification.user_id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              color: mapNotificationColor(notification.type),
              isRead: Boolean(notification.is_read),
              createdAt: notification.created_at,
              timeAgo: "Hozirgina",
              meta: notification.meta ?? null,
            });
          }
        }
      } catch (error) {
        console.error("Daily report cron error:", error);
      }
    },
    { timezone: TZ }
  );
}