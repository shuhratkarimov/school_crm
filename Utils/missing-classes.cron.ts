import cron from "node-cron";
import { DateTime } from "luxon";
import { Op } from "sequelize";
import { Group, Attendance, User, UserNotification, UserSettings } from "../Models";
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

export function startAttendanceMissingNotifier() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = DateTime.now().setZone(TZ);
      const todayStr = now.toISODate();

      const daysInUzbek = [
        "YAKSHANBA",
        "DUSHANBA",
        "SESHANBA",
        "CHORSHANBA",
        "PAYSHANBA",
        "JUMA",
        "SHANBA",
      ];

      const todayDayName = daysInUzbek[now.weekday % 7];

      const groups = await Group.findAll({
        attributes: [
          "id",
          "group_subject",
          "teacher_id",
          "branch_id",
          "start_time",
          "end_time",
          "days",
        ],
      });

      const todaysGroups = groups.filter((g: any) =>
        String(g.days || "")
          .split("-")
          .map((d: string) => d.trim().toUpperCase())
          .includes(todayDayName)
      );

      for (const group of todaysGroups as any[]) {
        const [endHour, endMinute] = String(group.end_time).split(":").map(Number);

        const classDeadline = DateTime.fromObject(
          {
            year: now.year,
            month: now.month,
            day: now.day,
            hour: endHour,
            minute: endMinute,
          },
          { zone: TZ }
        ).plus({ minutes: 30 });

        if (now < classDeadline) continue;

        const existingAttendance = await Attendance.findOne({
          where: {
            group_id: group.id,
            date: todayStr,
          },
        });

        if (existingAttendance) continue;

        const targetUsers = await User.findAll({
          where: {
            role: {
              [Op.in]: ["director"],
            },
            ...(group.branch_id ? { branch_id: group.branch_id } : {}),
          },
          attributes: ["id", "branch_id", "role"],
        });

        if (!targetUsers.length) continue;

        const targetUserIds = targetUsers.map((u: any) => u.id);

        const settings = await UserSettings.findAll({
          where: {
            user_id: targetUserIds,
            teacher_attendance: true,
          },
          attributes: ["user_id"],
        });

        const enabledUserIds = new Set(settings.map((s: any) => s.user_id));

        const filteredUsers = targetUsers.filter((u: any) => enabledUserIds.has(u.id));

        if (!filteredUsers.length) continue;

        const eventUniqueKey = `attendance_missing:${group.id}:${todayStr}`;

        const alreadySent = await UserNotification.findAll({
          where: {
            user_id: {
              [Op.in]: filteredUsers.map((u: any) => u.id),
            },
            event_unique_key: eventUniqueKey,
          },
          attributes: ["user_id"],
        });

        const alreadySentUserIds = new Set(alreadySent.map((n: any) => n.user_id));

        const notificationsPayload = filteredUsers
          .filter((u: any) => !alreadySentUserIds.has(u.id))
          .map((user: any) => ({
            user_id: user.id,
            title: "Yo'qlama qilinmadi",
            message: `${group.group_subject || "Guruh"} guruhi uchun bugungi yo'qlama hali qilinmagan`,
            type: "warning",
            is_read: false,
            event_key: "attendance_missing",
            event_unique_key: eventUniqueKey,
            meta: {
              group_id: group.id,
              branch_id: group.branch_id,
              teacher_id: group.teacher_id,
              date: todayStr,
            },
          }));

        if (!notificationsPayload.length) continue;

        const createdNotifications = await UserNotification.bulkCreate(
          notificationsPayload,
          { returning: true }
        );

        if (io && createdNotifications.length > 0) {
          for (const notification of createdNotifications as any[]) {
            const roomName = `user:${notification.user_id}`;

            io.to(roomName).emit("new-notification", {
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
      }
    } catch (error) {
      console.error("Attendance missing notifier error:", error);
    }
  }, {
    timezone: TZ,
  });
}