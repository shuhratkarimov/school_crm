// const notificationapi = require("notificationapi-node-server-sdk").default;

// notificationapi.init(
//   process.env.SMS_FIRST as string,
//   process.env.SMS_SECOND as string
// );

// export async function sendSMS(studentId: string, phone_number: string, defaultMessage:string) {
//     await notificationapi.send({
//         type: "welcome",
//         to: {
//           id: studentId,
//           number: phone_number,
//         },
//         sms: {
//           message: defaultMessage,
//         },
//       });
// }

const { EngagespotClient } = require('@engagespot/node');

export const client = EngagespotClient({
  apiKey: process.env.ENGAGESPOT_API_KEY,
  apiSecret: process.env.ENGAGESPOT_API_SECRET,
  dataRegion: 'us',
});

export async function sendSMS(studentId: string, phone_number: string, defaultMessage: string) {
  return await client.send({
    notification: {
      workflow: {
        identifier: 'default_welcome_workflow',
      },
    },
    data: {
      studentId,
      phone_number,
      defaultMessage,
    },
    sendTo: {
      recipients: [
        {
          identifier: studentId,
          phoneNumber: phone_number,
        }
      ],
    },
  });
}