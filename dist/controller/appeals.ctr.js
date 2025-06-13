"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastTenDayAppeals = exports.getAppeals = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const appeal_model_1 = __importDefault(require("../Models/appeal_model"));
const sequelize_1 = require("sequelize");
const student_model_1 = __importDefault(require("../Models/student_model"));
const uuid_1 = require("uuid");
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
const loadMessages = (lang) => {
    try {
        return JSON.parse(fs_1.default.readFileSync(`./locales/${lang}.json`, "utf8"));
    }
    catch (error) {
        console.error(`Error loading language file for ${lang}:`, error);
        return JSON.parse(fs_1.default.readFileSync("./locales/uz.json", "utf8"));
    }
};
bot.onText(/\/start/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = msg.chat.id;
    let lang = "uz";
    try {
        const findStudent = yield student_model_1.default.findOne({
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
}));
bot.on("message", (msg) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = msg.chat.id;
    const text = msg.text;
    let lang = "uz";
    if (!text || typeof text !== "string" || !regex.test(text)) {
        const messages = loadMessages(lang);
        return bot.sendMessage(chatId, messages.enter_text);
    }
    try {
        if ((0, uuid_1.validate)(text)) {
            const findStudent = yield student_model_1.default.findOne({ where: { id: text } });
            if (!findStudent) {
                const messages = loadMessages(lang);
                return bot.sendMessage(chatId, messages.incorrect_id);
            }
            yield findStudent.update({ telegram_user_id: chatId });
            lang = findStudent.dataValues.language || "uz";
            const messages = loadMessages(lang);
            return bot.sendMessage(chatId, messages.start.replace("{name}", findStudent.dataValues.first_name));
        }
        const findStudent = yield student_model_1.default.findOne({
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
        yield appeal_model_1.default.create({
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
}));
const getAppeals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const messages = loadMessages(lang);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const appeals = yield appeal_model_1.default.findAll({
            where: {
                created_at: {
                    [sequelize_1.Op.gte]: today,
                },
            },
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
});
exports.getAppeals = getAppeals;
const getLastTenDayAppeals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lang = req.headers["accept-language"] || "uz";
        const messages = loadMessages(lang);
        const startOfDay = new Date();
        startOfDay.setDate(startOfDay.getDate() - 10);
        startOfDay.setHours(0, 0, 0, 0);
        const appeals = yield appeal_model_1.default.findAll({
            where: {
                created_at: {
                    [sequelize_1.Op.gte]: startOfDay,
                },
            },
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
});
exports.getLastTenDayAppeals = getLastTenDayAppeals;
