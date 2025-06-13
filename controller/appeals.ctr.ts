import TelegramBot from "node-telegram-bot-api";
import Appeal from "../Models/appeal_model";
import { Request, Response } from "express";
import { Op } from "sequelize";
import {Student} from "../Models/index";
import { validate as isUUID } from "uuid";
import fs from "fs";

let botToken = process.env.BOT_TOKEN;

Appeal.sync({ force: false });

if (!botToken) {
  throw new Error("Telegram bot token not found!");
}

let regex: RegExp = /^[a-zA-Z0-9!@#$%^&*()_+-{}~`, ."':;?//\|]*$/;
let bot = new TelegramBot(botToken as string, {
  polling: {
    autoStart: true,
    interval: 300,
    params: {
      timeout: 10,
    },
  },
});

export const sendTelegramMessage = async (req: Request, res: Response) => {
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
    const appeal = await Appeal.findOne({ where: { id: requestId } });
    if (!appeal) {
      return res.status(404).json({ message: "Murojaat topilmadi" });
    }
    appeal.answer = message;
    await appeal.save();
    return res.status(200).json({ message: "Xabar yuborildi va bazaga saqlandi ✅" });
  } catch (error) {
    console.error("Telegramga xabar yuborishda xatolik:", error);
    return res.status(500).json({ message: "Xabar yuborishda xatolik yuz berdi" });
  }
};

const loadMessages = (lang: string) => {
  try {
    return JSON.parse(fs.readFileSync(`./locales/${lang}.json`, "utf8"));
  } catch (error) {
    console.error(`Error loading language file for ${lang}:`, error);
    return JSON.parse(fs.readFileSync("./locales/uz.json", "utf8"));
  }
};

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  let lang = "uz";

  try {
    const findStudent = await Student.findOne({
      where: { telegram_user_id: chatId },
    });
    if (!findStudent) {
      const messages = loadMessages(lang);
      return bot.sendMessage(chatId, messages.welcome);
    }
    lang = findStudent.dataValues.language || "uz";
    const messages = loadMessages(lang);
    return bot.sendMessage(
      chatId,
      messages.start.replace("{name}", findStudent.dataValues.first_name)
    );
  } catch (error) {
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
      const findStudent = await Student.findOne({ where: { studental_id: text.slice(2) } });      
      if (!findStudent) {
        const messages = loadMessages(lang);
        return bot.sendMessage(chatId, messages.incorrect_id);
      }
      await findStudent.update({ telegram_user_id: chatId });
      lang = findStudent.dataValues.language || "uz";
      const messages = loadMessages(lang);
      return bot.sendMessage(
        chatId,
        messages.start.replace("{name}", findStudent.dataValues.first_name)
      );
    }
    const findStudent = await Student.findOne({
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

    await Appeal.create({
      pupil_id: findStudent.dataValues.id,
      message: text,
      telegram_user_id: chatId,
      is_seen: false,
      is_answered: false,
    });
    return bot.sendMessage(chatId, messages.request_received);
  } catch (error) {
    console.error("Error handling message: ", error);
    const messages = loadMessages(lang);
    return bot.sendMessage(chatId, messages.error);
  }
});

export const getAppeals = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const messages = loadMessages(lang);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appeals = await Appeal.findAll({
      where: {
        created_at: {
          [Op.gte]: today,
        },
      },
      include: [{
        model: Student,
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
  } catch (error) {
    console.error(error);
    const lang = req.headers["accept-language"] || "uz";
    const messages = loadMessages(lang);
    return res.status(500).json({ message: messages.server_error });
  }
};

export const getLastTenDayAppeals = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const lang = req.headers["accept-language"] || "uz";
    const messages = loadMessages(lang);

    const startOfDay = new Date();
    startOfDay.setDate(startOfDay.getDate() - 10);
    startOfDay.setHours(0, 0, 0, 0);

    const appeals = await Appeal.findAll({
      where: {
        created_at: {
          [Op.gte]: startOfDay,
        },
      },
      include: [{
        model: Student,
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
  } catch (error) {
    console.error(error);
    const lang = req.headers["accept-language"] || "uz";
    const messages = loadMessages(lang);
    return res.status(500).json({ message: messages.server_error });
  }
}

export async function deleteAppeal( req: Request,
  res: Response
): Promise<Response | void>{
  try {
    await Appeal.destroy({where: {id: req.params.id}})
    return res.status(200).json({
      message: "Deleted successfully!"
    });
  } catch (error) {
    console.error(error);
    const lang = req.headers["accept-language"] || "uz";
    const messages = loadMessages(lang);
    return res.status(500).json({ message: messages.server_error });
  }
}