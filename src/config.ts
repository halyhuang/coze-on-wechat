import fs from 'fs';
import { parse } from 'yaml';
import { IConfig } from './interface';

let configFile: any = {};

// git config
if (fs.existsSync('./config.yaml')) {
  // get configurations from 'config.yaml' first
  const file = fs.readFileSync('./config.yaml', 'utf8');
  configFile = parse(file);
}

if (!configFile.accessToken && !configFile.botId) {
  throw new Error(
    '⚠️ No ACCESS_TOKEN or BOT_ID found in env, please export to env or configure in config.yaml'
  );
}

console.log('🚀 Configurations:', configFile);

export const Config: IConfig = {
  accessToken: configFile.accessToken,
  botId: configFile.botId,
  cozeTriggerKeyword: configFile.cozeTriggerKeyword || '',
  blacklist: configFile.blacklist || [],
};
