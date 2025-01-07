import { IModelService, IModelConfig } from '../interfaces/model';
import { CozeService } from './models/coze';
import { OpenAIService } from './models/openai';

export class ModelFactory {
  static createModel(config: IModelConfig): IModelService {
    switch (config.type) {
      case 'coze':
        return new CozeService(config);
      case 'openai':
        return new OpenAIService(config);
      default:
        throw new Error(`Unsupported model type: ${config.type}`);
    }
  }
} 