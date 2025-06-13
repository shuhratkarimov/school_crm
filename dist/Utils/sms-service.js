"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMS = sendSMS;
const notificationapi = require("notificationapi-node-server-sdk").default;
notificationapi.init(process.env.SMS_FIRST, process.env.SMS_SECOND);
async function sendSMS(studentId, phone_number, defaultMessage) {
    await notificationapi.send({
        type: "welcome",
        to: {
            id: studentId,
            number: phone_number,
        },
        sms: {
            message: defaultMessage,
        },
    });
}
