"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastTenDayAppeals = exports.getAppeals = exports.sendTelegramMessage = void 0;
exports.deleteAppeal = deleteAppeal;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const appeal_model_1 = __importDefault(require("../Models/appeal_model"));
const sequelize_1 = require("sequelize");
const index_1 = require("../Models/index");
const fs_1 = __importDefault(require("fs"));
let botToken = process.env.BOT_TOKEN;
appeal_model_1.default.sync({ force: false });
if (!botToken) {
    throw new Error("Telegram bot token not found!");
}
let regex = /^[a-zA-Z0-9!@#$%^&*()_+-{}~`, ."':;?//\|]*$/;
let bot = new node_telegram_bot_api_1.default(botToken, {
    polling: {
        autoStart: true,
        interval: 300,
        params: {
            timeout: 10,
        },
    },
});
const sendTelegramMessage = async (req, res) => {
    const { userId, message, requestId } = req.body;
    if (!userId || !message || !requestId) {
        return res.status(400).json({ message: "Foydalanuvchi ID, xabar va request ID kerak" });
    }
    try {
        const formattedMessage = `
*Intellectual Progress Star O'quv Markazi*

Hurmatli mijozimiz!

Sizga quyidagi xabar yuborildi:
_${message}_

Iltimos, ushbu xabarga e'tibor bering va zarur bo'lsa, javob bering. Biz har doim sizning qulayligingiz uchun tayyormiz!

Hurmat bilan,
*Intellectual Progress Star Jamoasi*
📅 ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
    `.trim();
        await bot.sendMessage(userId, formattedMessage, { parse_mode: "Markdown" });
        const appeal = await appeal_model_1.default.findOne({ where: { id: requestId } });
        if (!appeal) {
            return res.status(404).json({ message: "Murojaat topilmadi" });
        }
        appeal.answer = message;
        await appeal.save();
        return res.status(200).json({ message: "Xabar yuborildi va bazaga saqlandi ✅" });
    }
    catch (error) {
        console.error("Telegramga xabar yuborishda xatolik:", error);
        return res.status(500).json({ message: "Xabar yuborishda xatolik yuz berdi" });
    }
};
exports.sendTelegramMessage = sendTelegramMessage;
const loadMessages = (lang) => {
    try {
        return JSON.parse(fs_1.default.readFileSync(`./locales/${lang}.json`, "utf8"));
    }
    catch (error) {
        console.error(`Error loading language file for ${lang}:`, error);
        return JSON.parse(fs_1.default.readFileSync("./locales/uz.json", "utf8"));
    }
};
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    let lang = "uz";
    try {
        const findStudent = await index_1.Student.findOne({
            where: { telegram_user_id: chatId },
        });
        if (!findStudent) {
            const messages = loadMessages(lang);
            return bot.sendMessage(chatId, messages.welcome);
        }
        lang = findStudent.dataValues.language || "uz";
        const messages = loadMessages(lang);
        return bot.sendMessage(chatId, messages.start.replace("{name}", findStudent.dataValues.first_name));
    }
    catch (error) {
        console.error("Error fetching student: ", error);
        const messages = loadMessages(lang);
        return bot.sendMessage(chatId, messages.error);
    }
});
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    let lang = "uz";
    if (!text || typeof text !== "string" || !regex.test(text)) {
        const messages = loadMessages(lang);
        return bot.sendMessage(chatId, messages.enter_text);
    }
    try {
        if (text.startsWith("ID")) {
            const findStudent = await index_1.Student.findOne({ where: { studental_id: text.slice(2) } });
            if (!findStudent) {
                const messages = loadMessages(lang);
                return bot.sendMessage(chatId, messages.incorrect_id);
            }
            await findStudent.update({ telegram_user_id: chatId });
            lang = findStudent.dataValues.language || "uz";
            const messages = loadMessages(lang);
            return bot.sendMessage(chatId, messages.start.replace("{name}", findStudent.dataValues.first_name));
        }
        const findStudent = await index_1.Student.findOne({
            where: { telegram_user_id: chatId },
        });
        if (text === "/start") {
            return;
        }
        if (!findStudent) {
            const messages = loadMessages(lang);
            return bot.sendMessage(chatId, messages.welcome);
        }
        lang = findStudent.dataValues.language || "uz";
        const messages = loadMessages(lang);
        await appeal_model_1.default.create({
            pupil_id: findStudent.dataValues.id,
            message: text,
            telegram_user_id: chatId,
            is_seen: false,
            is_answered: false,
        });
        return bot.sendMessage(chatId, messages.request_received);
    }
    catch (error) {
        console.error("Error handling message: ", error);
        const messages = loadMessages(lang);
        return bot.sendMessage(chatId, messages.error);
    }
});
const getAppeals = async (req, res) => {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const messages = loadMessages(lang);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const appeals = await appeal_model_1.default.findAll({
            where: {
                created_at: {
                    [sequelize_1.Op.gte]: today,
                },
            },
            include: [{
                    model: index_1.Student,
                    as: "student",
                    attributes: ["first_name", "last_name", "group_id", "phone_number"]
                }]
        });
        if (appeals.length === 0) {
            return res.status(404).json({
                message: messages.no_appeals_today,
            });
        }
        return res.status(200).json(appeals);
    }
    catch (error) {
        console.error(error);
        const lang = req.headers["accept-language"] || "uz";
        const messages = loadMessages(lang);
        return res.status(500).json({ message: messages.server_error });
    }
};
exports.getAppeals = getAppeals;
const getLastTenDayAppeals = async (req, res) => {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const messages = loadMessages(lang);
        const startOfDay = new Date();
        startOfDay.setDate(startOfDay.getDate() - 10);
        startOfDay.setHours(0, 0, 0, 0);
        const appeals = await appeal_model_1.default.findAll({
            where: {
                created_at: {
                    [sequelize_1.Op.gte]: startOfDay,
                },
            },
            include: [{
                    model: index_1.Student,
                    as: "student",
                    attributes: ["first_name", "last_name", "group_id", "phone_number"]
                }]
        });
        if (appeals.length === 0) {
            return res.status(404).json({
                message: messages.no_appeals_last_10_days,
            });
        }
        return res.status(200).json(appeals);
    }
    catch (error) {
        console.error(error);
        const lang = req.headers["accept-language"] || "uz";
        const messages = loadMessages(lang);
        return res.status(500).json({ message: messages.server_error });
    }
};
exports.getLastTenDayAppeals = getLastTenDayAppeals;
async function deleteAppeal(req, res) {
    try {
        await appeal_model_1.default.destroy({ where: { id: req.params.id } });
        return res.status(200).json({
            message: "Deleted successfully!"
        });
    }
    catch (error) {
        console.error(error);
        const lang = req.headers["accept-language"] || "uz";
        const messages = loadMessages(lang);
        return res.status(500).json({ message: messages.server_error });
    }
}
