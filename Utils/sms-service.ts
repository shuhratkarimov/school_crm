const notificationapi = require("notificationapi-node-server-sdk").default;

notificationapi.init(
  process.env.SMS_FIRST as string,
  process.env.SMS_SECOND as string
);

export async function sendSMS(studentId: string, phone_number: string, defaultMessage:string) {
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
