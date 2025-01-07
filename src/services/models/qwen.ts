import axios from 'axios';
import { IModelService, IMessage, IChatResponse, IModelConfig } from '../../interfaces/model';

export class QwenService implements IModelService {
  private client;
  private config: IModelConfig;

  constructor(config: IModelConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiEndpoint || 'https://dashscope.aliyuncs.com/api/v1',
      timeout: 60000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async chat(messages: IMessage[], userId: string): Promise<IChatResponse> {
    try {
      const response = await this.client.post('/services/aigc/text-generation/generation', {
        model: this.config.model || 'qwen-turbo',
        input: {
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        },
        parameters: {
          temperature: this.config.temperature || 0.7,
          max_tokens: this.config.maxTokens || 2000,
          user: userId
        }
      });

      return {
        message: response.data.output.text || '',
        status: response.status
      };
    } catch (error) {
      console.error('Qwen API error:', error);
      throw error;
    }
  }
} 