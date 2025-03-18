import Notification from "../Models/notification_model";

export const createNotification = async (pupil_id: string, message: string) => {
  try {
    await Notification.create({ pupil_id, message });
  } catch (error) {
    console.error("Notification yaratishda xatolik:", error);
  }
};
