"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationsOfStudent = getNotificationsOfStudent;
exports.makeNotificationAsRead = makeNotificationAsRead;
exports.getNotificationsOfCenter = getNotificationsOfCenter;
exports.makeNotificationOfCentersAsRead = makeNotificationOfCentersAsRead;
const base_error_1 = require("../Utils/base_error");
const notification_model_1 = __importDefault(require("../Models/notification_model"));
const lang_1 = __importDefault(require("../Utils/lang"));
const notification_center_model_1 = __importDefault(require("../Models/notification_center.model"));
async function getNotificationsOfStudent(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const notifications = await notification_model_1.default.findAll({ where: { pupil_id: req.params.id } });
        if (notifications.length === 0) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("notifications_not_found", { lng: lang })));
        }
        res.status(200).json(notifications);
    }
    catch (error) {
        next(error);
    }
}
async function makeNotificationAsRead(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const notification = await notification_model_1.default.findByPk(req.params.id);
        if (!notification) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("notification_not_found", { lng: lang })));
        }
        await notification.update({ is_read: true });
        res.status(200).json({
            message: lang_1.default.t("notification_updated", { lng: lang }),
            notification,
        });
    }
    catch (error) {
        next(error);
    }
}
////////////////////////////// center
async function getNotificationsOfCenter(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const notifications = await notification_center_model_1.default.findAll({ where: { center_id: req.params.id } });
        if (notifications.length === 0) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("notifications_not_found", { lng: lang })));
        }
        res.status(200).json(notifications);
    }
    catch (error) {
        next(error);
    }
}
async function makeNotificationOfCentersAsRead(req, res, next) {
    try {
        const lang = req.headers["accept-language"]?.split(",")[0] || "uz";
        const notification = await notification_center_model_1.default.findByPk(req.params.id);
        if (!notification) {
            return next(base_error_1.BaseError.BadRequest(404, lang_1.default.t("notification_not_found", { lng: lang })));
        }
        await notification.update({ is_read: true });
        res.status(200).json({
            message: lang_1.default.t("notification_updated", { lng: lang }),
            notification,
        });
    }
    catch (error) {
        next(error);
    }
}
