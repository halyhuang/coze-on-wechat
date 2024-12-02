import { Message } from "wechaty";
import { ContactInterface, RoomInterface } from "wechaty/impls";
import CozeApi, { IMessage } from './api';
import { Config } from "./config";

enum MessageType {
  Unknown = 0,
  Attachment = 1, // Attach(6),
  Audio = 2, // Audio(1), Voice(34)
  Contact = 3, // ShareCard(42)
  ChatHistory = 4, // ChatHistory(19)
  Emoticon = 5, // Sticker: Emoticon(15), Emoticon(47)
  Image = 6, // Img(2), Image(3)
  Text = 7, // Text(1)
  Location = 8, // Location(48)
  MiniProgram = 9, // MiniProgram(33)
  GroupNote = 10, // GroupNote(53)
  Transfer = 11, // Transfers(2000)
  RedEnvelope = 12, // RedEnvelopes(2001)
  Recalled = 13, // Recalled(10002)
  Url = 14, // Url(5)
  Video = 15, // Video(4), Video(43)
  Post = 16, // Moment, Channel, Tweet, etc
}
export default class CozeBot {
  // chatbot name (WeChat account name)
  botName: string = '';

  // chatbot start time (prevent duplicate response on restart)
  startTime: Date = new Date();

  // self-chat may cause some issue for some WeChat Account
  // please set to true if self-chat cause some errors
  disableSelfChat: boolean = false;

  // chatbot trigger keyword
  cozeTriggerKeyword: string = Config.cozeTriggerKeyword;

  // Coze error response
  cozeErrorMessage: string = '🤖️：Coze智能体摆烂了，请稍后再试～';

  // Coze system content configuration (guided by OpenAI official document)
  currentDate: string = new Date().toISOString().split('T')[0];

  // message size for a single reply by the bot
  SINGLE_MESSAGE_MAX_SIZE: number = 800;

  // set bot name during login stage
  setBotName(botName: string) {
    this.botName = botName;
  }

  // get trigger keyword in group chat: (@Name <keyword>)
  // in group chat, replace the special character after "@username" to space
  // to prevent cross-platfrom mention issue
  private get chatGroupTriggerKeyword(): string {
    return `@${this.botName} ${this.cozeTriggerKeyword || ''}`;
  }

  // configure API with model API keys and run an initial test
  async startCozeBot() {
    try {
      // Hint user the trigger keyword in private chat and group chat
      console.log(`🤖️ Coze name is: ${this.botName}`);
      console.log(`🎯 Trigger keyword in private chat is: ${this.cozeTriggerKeyword}`);
      console.log(`🎯 Trigger keyword in group chat is: ${this.chatGroupTriggerKeyword}`);
      // Run an initial test to confirm API works fine
      // await this.onChat("Say Hello World");
      console.log(`✅ Coze starts success, ready to handle message!`);
    } catch (e) {
      console.error(`❌ ${e}`);
    }
  }

  // get clean message by removing reply separater and group mention characters
  private async cleanMessage({
    message,
    rawText,
    messageType,
    isPrivateChat,
  }: {
    message: Message;
    messageType: MessageType;
    rawText: string;
    isPrivateChat: boolean;
  }): Promise<string> {
    if (messageType === MessageType.Text) {
      let text = rawText;
      const item = rawText.split('- - - - - - - - - - - - - - -');
      if (item.length > 1) {
        text = item[item.length - 1];
      }
      return text.slice(isPrivateChat ? this.cozeTriggerKeyword.length : this.chatGroupTriggerKeyword.length);
    }

    if (messageType === MessageType.Url) {
      const urlLink = await message.toUrlLink();
      const url = urlLink.payload.url;
      console.log('文章链接：', url);
      // 微信公众号分享长链接，包含 &amp; 编码
      // http://mp.weixin.qq.com/s?__biz=MjM5NjM5MjQ4MQ==&amp;mid=2651752963&amp;idx=1&amp;sn=6d3cdc5fb1b6235e82eeab0080b40455&amp;chksm=bc73941ba5440bf4ae117aea9196763664c2074e45db306a1ca752fbed9da94a8434b142fff6&amp;mpshare=1&amp;scene=1&amp;srcid=1022Z2ezhg8wxfmHeRhtwsza&amp;sharer_shareinfo=b7e207bcaf654d5ba769ab3c6d6919e7&amp;sharer_shareinfo_first=b7e207bcaf654d5ba769ab3c6d6919e7#rd'
      // 将 &amp; 替换为 &
      const decodedUrl = url.replace(/&amp;/g, '&');
      const parsedUrl = new URL(decodedUrl);
      // 创建一个新的URLSearchParams对象，用于保存你想要保留的参数
      const searchParams = new URLSearchParams(parsedUrl.searchParams);
      const filteredParams = new URLSearchParams();
      // 只保留 4 个关键参数
      ['__biz', 'mid', 'idx', 'sn'].forEach((param) => {
        const value = searchParams.get(param);
        if (value) {
          filteredParams.append(param, value);
        }
      });
      const newUrl = `${parsedUrl.origin}${parsedUrl.pathname}?${filteredParams.toString()}`;
      return newUrl;
    }
    return '';
  }

  // check whether Coze bot can be triggered
  private triggerCozeMessage(text: string, isPrivateChat: boolean = false): boolean {
    const cozeTriggerKeyword = this.cozeTriggerKeyword;
    let triggered = false;
    if (isPrivateChat) {
      triggered = cozeTriggerKeyword ? text.startsWith(cozeTriggerKeyword) : true;
    } else {
      // due to un-unified @ lagging character, ignore it and just match:
      //    1. the "@username" (mention)
      //    2. trigger keyword
      // start with @username
      const textMention = `@${this.botName}`;
      const startsWithMention = text.startsWith(textMention);
      const textWithoutMention = text.slice(textMention.length + 1);
      const followByTriggerKeyword = textWithoutMention.startsWith(this.cozeTriggerKeyword);
      triggered = startsWithMention && !!textWithoutMention && followByTriggerKeyword;
    }
    if (triggered) {
      console.log(`🎯 Coze triggered: ${text}`);
    }
    return triggered;
  }

  // filter out the message that does not need to be processed
  private isNonsense(talker: ContactInterface, messageType: MessageType, text: string): boolean {
    return (
      (this.disableSelfChat && talker.self()) ||
      ![MessageType.Text, MessageType.Url].includes(messageType) ||
      // 虽然可能误伤，但是更全面地过滤
      talker.name().includes('微信') ||
      // video or voice reminder
      text.includes('收到一条视频/语音聊天消息，请在手机上查看') ||
      // red pocket reminder
      text.includes('收到红包，请在手机上查看') ||
      // location information
      text.includes('/cgi-bin/mmwebwx-bin/webwxgetpubliclinkimg')
    );
  }

  // create messages for Coze API request
  // TODO: store history chats for supporting context chat
  private createMessages(text: string): IMessage[] {
    const messages = [
      {
        role: 'user' as const,
        content: text,
        content_type: 'text' as const,
      },
    ];
    return messages;
  }

  // send question to Coze with OpenAI API and get answer
  async onChat(text: string, name: string): Promise<string> {
    const inputMessages = this.createMessages(text);
    try {
      // config OpenAI API request body
      const chatgptReplyMessage = await CozeApi.chat(inputMessages, name);
      console.log(`🤖️ Coze says: ${chatgptReplyMessage}`);
      return chatgptReplyMessage || this.cozeErrorMessage;
    } catch (e: any) {
      console.error(`❌ ${e}`);
      return this.cozeErrorMessage;
    }
  }

  // reply with the segmented messages from a single-long message
  private async reply(talker: RoomInterface | ContactInterface, message: string): Promise<void> {
    const messages: Array<string> = [];
    while (message.length > this.SINGLE_MESSAGE_MAX_SIZE) {
      messages.push(message.slice(0, this.SINGLE_MESSAGE_MAX_SIZE));
      message = message.slice(this.SINGLE_MESSAGE_MAX_SIZE);
    }
    messages.push(message);
    for (const msg of messages) {
      await talker.say(msg);
    }
  }

  // reply to private message
  private async onPrivateMessage(talker: ContactInterface, text: string, name: string) {
    // get reply from Coze
    try {
      const chatgptReplyMessage = await this.onChat(text, name);
      if (!chatgptReplyMessage) {
        return;
      }

      // send the Coze reply to chat
      await this.reply(talker, chatgptReplyMessage);
    } catch (e) {
      console.log('no reply...');
    }
  }

  // reply to group message
  private async onGroupMessage(room: RoomInterface, text: string, name: string) {
    // get reply from Coze
    const chatgptReplyMessage = await this.onChat(text, name);
    // the whole reply consist of: original text and bot reply
    const wholeReplyMessage = `${text}\n----------\n${chatgptReplyMessage}`;
    await this.reply(room, wholeReplyMessage);
  }

  // receive a message (main entry)
  async onMessage(message: Message) {
    const talker = message.talker();
    const rawText = message.text();
    const room = message.room();
    const messageType = message.type();
    const isPrivateChat = !room;
    // do nothing if the message:
    //    1. is irrelevant (e.g. voice, video, location...), or
    //    2. doesn't trigger bot (e.g. wrong trigger-word)
    if (this.isNonsense(talker, messageType, rawText) || !this.triggerCozeMessage(rawText, isPrivateChat)) {
      return;
    }

    // massage sender's name
    const name = talker.name();
    // clean the message for Coze input
    const text = await this.cleanMessage({ message, messageType, rawText, isPrivateChat });
    console.log('最终 name,text:', name, text);

    // reply to private or group chat
    if (isPrivateChat) {
      return await this.onPrivateMessage(talker, text, name);
    } else {
      return await this.onGroupMessage(room, text, name);
    }
  }
}
