import QRCode from 'qrcode';
import { WechatyBuilder, ScanStatus } from 'wechaty';
import { PuppetWechat4u } from 'wechaty-puppet-wechat4u';
import CozeBot from './coze';
import 'dotenv/config';

// 创建 PuppetWechat4u 实例
const puppet = new PuppetWechat4u({
  uos: true,  // 使用新版本的 UOS 协议
  puppetOptions: {
    timeout: 60000,
    retryTimes: 5
  }
});

// Wechaty instance
const wechatBot = WechatyBuilder.build({
  name: 'wechat-coze-bot',
  puppet
});

// CozeBot instance
const cozeBot = new CozeBot();

// 错误重试函数
async function retryOperation(operation: () => Promise<any>, maxRetries = 3, delay = 5000): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Operation failed, retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function main() {
  // 全局错误处理
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    try {
      await wechatBot.stop();
      console.log('Bot stopped due to error, restarting in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await main();
    } catch (e) {
      console.error('Failed to restart bot:', e);
    }
  });

  wechatBot
    .on('scan', async (qrcode, status) => {
      if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
        const url = `https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`;
        console.log(`💡 Scan QR Code to login: ${status}\n${url}`);
        console.log(await QRCode.toString(qrcode, { type: 'terminal', small: true }));
      } else {
        console.log(`Scan status: ${status}`);
      }
    })
    .on('login', async (user) => {
      console.log(`✅ User ${user} has logged in`);
      await retryOperation(async () => {
        cozeBot.setBotName(user.name());
        await cozeBot.startCozeBot();
      });
    })
    .on('message', async (message) => {
      try {
        const msgDate = message.date();
        if (msgDate.getTime() <= cozeBot.startTime.getTime()) {
          return;
        }

        console.log(`📨 ${message}`);
        await retryOperation(() => cozeBot.onMessage(message));
      } catch (e) {
        console.error(`❌ Message handling error:`, e);
      }
    })
    .on('error', async (error) => {
      console.error('Bot error:', error);
      // 不要在这里重启，让全局错误处理来处理
    });

  try {
    await wechatBot.start();
  } catch (e) {
    console.error(`❌ Bot failed to start:`, e);
    console.log('Retrying in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await main();
  }
}

// 启动主程序
main().catch(console.error);
