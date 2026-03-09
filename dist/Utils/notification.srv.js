"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = void 0;
const notification_model_1 = __importDefault(require("../Models/notification_model"));
const createNotification = async (pupil_id, message, p0) => {
    try {
        await notification_model_1.default.create({ pupil_id, message });
    }
    catch (error) {
        console.error("Notification yaratishda xatolik:", error);
    }
};
exports.createNotification = createNotification;
