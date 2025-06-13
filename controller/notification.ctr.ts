import { NextFunction, Request, Response } from "express";
import { BaseError } from "../Utils/base_error";
import Notification from "../Models/notification_model";
import i18next from "../Utils/lang";
import NotificationToCenter from "../Models/notification_center.model";

async function getNotificationsOfStudent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const notifications = await Notification.findAll({ where: { pupil_id: req.params.id } });

    if (notifications.length === 0) {
      return next(BaseError.BadRequest(404, i18next.t("notifications_not_found", { lng: lang })));
    }

    res.status(200).json(notifications);
  } catch (error: any) {
    next(error);
  }
}

async function makeNotificationAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const notification = await Notification.findByPk(req.params.id as string);

    if (!notification) {
      return next(BaseError.BadRequest(404, i18next.t("notification_not_found", { lng: lang })));
    }

    await notification.update({ is_read: true });

    res.status(200).json({
      message: i18next.t("notification_updated", { lng: lang }),
      notification,
    });
  } catch (error: any) {
    next(error);
  }
}

////////////////////////////// center

async function getNotificationsOfCenter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const notifications = await NotificationToCenter.findAll({ where: { center_id: req.params.id } });

    if (notifications.length === 0) {
      return next(BaseError.BadRequest(404, i18next.t("notifications_not_found", { lng: lang })));
    }

    res.status(200).json(notifications);
  } catch (error: any) {
    next(error);
  }
}

async function makeNotificationOfCentersAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
    const notification = await NotificationToCenter.findByPk(req.params.id as string);

    if (!notification) {
      return next(BaseError.BadRequest(404, i18next.t("notification_not_found", { lng: lang })));
    }

    await notification.update({ is_read: true });

    res.status(200).json({
      message: i18next.t("notification_updated", { lng: lang }),
      notification,
    });
  } catch (error: any) {
    next(error);
  }
}

export { getNotificationsOfStudent, makeNotificationAsRead, getNotificationsOfCenter, makeNotificationOfCentersAsRead };
