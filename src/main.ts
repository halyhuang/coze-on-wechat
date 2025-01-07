import QRCode from 'qrcode';
import { WechatyBuilder, ScanStatus } from 'wechaty';
import CozeBot from './coze';

// Wechaty instance
const wechatBot = WechatyBuilder.build({
  name: 'wechat-coze-bot',
});
// CozeBot instance
const cozeBot = new CozeBot();

async function main() {
  wechatBot
    // scan QR code for login
    .on('scan', async (qrcode, status) => {
      const url = `https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`;
      console.log(`💡 Scan QR Code in WeChat to login: ${ScanStatus[status]}\n${url}`);
      console.log(await QRCode.toString(qrcode, { type: 'terminal', small: true }));
    })
    // login to WeChat desktop account
    .on('login', async (user: any) => {
      console.log(`✅ User ${user} has logged in`);
      cozeBot.setBotName(user.name());
      await cozeBot.startCozeBot();
    })
    // message handler
    .on('message', async (message: any) => {
      try {
        // 防止重启时响应历史消息
        const msgDate = message.date();
        if (msgDate.getTime() <= cozeBot.startTime.getTime()) {
          return;
        }

        console.log(`📨 ${message}`);
        // 处理消息
        await cozeBot.onMessage(message);
      } catch (e) {
        console.error(`❌ ${e}`);
      }
    });

  try {
    await wechatBot.start();
  } catch (e) {
    console.error(`❌ Your Bot failed to start: ${e}`);
    console.log('🤔 Can you login WeChat in browser? The bot works on the desktop WeChat');
  }
}
main();
