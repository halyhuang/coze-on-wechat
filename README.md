# coze-on-wechat

## 项目简介

`coze-on-wechat` 是一个用于将微信与 Coze 智能体对接的项目。通过这个项目，你可以在微信中与 Coze 智能体进行交互，实现自动化对话和消息处理。

## 本地开发

1. 克隆仓库到本地：

    ```sh
    git clone https://github.com/yourusername/coze-on-wechat.git
    ```

2. 进入项目目录：

    ```sh
    cd coze-on-wechat
    ```

3. 安装依赖：

    ```sh
    npm install
    ```

4. 复制 `.env.example` 文件并重命名为 `.env`：

    ```sh
    cp .env.example .env
    ```

5. 编辑 `.env` 文件，填写必要的配置项 `ACCESS_TOKEN` 和 `BOT_ID`，具体参考：[Coze 开发指南](https://www.coze.cn/docs/developer_guides/authentication)

6. 启动项目：

    ```sh
    npm run dev
    ```

## 一键部署

### 部署到 Railway

1. 点击下面的按钮部署到 Railway：

    [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/ZdPCcV?referralCode=oChFK_)

### 部署到阿里云

docker 部署：（待补充）

源码部署：注意使用 pm2 来守护进程，防止被杀死

## 效果示例

![chat](https://osinsight.tos-cn-beijing.volces.com/coze-on-wechat/cow-chat.jpg?x-tos-process=style/image_compress)
