import * as dotenv from 'dotenv';
import fs from 'fs';
import { parse } from 'yaml';
import { IConfig } from './interface';

dotenv.config();

let configFile: any = {};

// git config
if (fs.existsSync('./config.yaml')) {
  // get configurations from 'config.yaml' first
  const file = fs.readFileSync('./config.yaml', 'utf8');
  configFile = parse(file);
} else {
  // if 'config.yaml' not exist, read them from env
  configFile = {
    accessToken: process.env.ACCESS_TOKEN,
    botId: process.env.BOT_ID,
    cozeTriggerKeyword: process.env.COZE_TRIGGER_KEYWORD,
  };
}

if (!configFile.accessToken) {
  console.error('⚠️ No ACCESS_TOKEN found in env, please export to env or configure in .env or config.yaml');
}

if (!configFile.botId) {
  console.error('⚠️ No BOT_ID found in env, please export to env or configure in .env or config.yaml');
}

export const Config: IConfig = {
  accessToken: configFile.accessToken,
  botId: configFile.botId,
  cozeTriggerKeyword: configFile.cozeTriggerKeyword || '',
};
