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

if (!configFile.modelConfig.apiKey && !configFile.modelConfig.model) {
  throw new Error(
    '⚠️ No API_KEY or MODEL found in env, please export to env or configure in config.yaml'
  );
}

console.log('🚀 Configurations:', configFile);

export const Config: IConfig = {
  apiKey: configFile.modelConfig.apiKey,
  model: configFile.modelConfig.model,
  cozeTriggerKeyword: configFile.botConfig.cozeTriggerKeyword || '',
  blacklist: configFile.botConfig.blacklist || [],
  modelConfig: configFile.modelConfig,
  fallbackModel: configFile.fallbackModel
};
