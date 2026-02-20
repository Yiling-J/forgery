<p align="left">
    中文 &nbsp;｜&nbsp; <a href="README.md">English</a>
</p>

<div align="center">
  <img src="public/logo-large.webp" alt="Forgery Logo" width="200" height="200" />
  <h1>Forgery</h1>
  <p><strong>使用 AI 构建、重组和重塑角色</strong></p>
</div>

<video src="https://github.com/user-attachments/assets/caa63fcf-ee64-4df0-8e17-c13672eeab46"></video>

创造角色，而非混乱。Forgery 帮助你从角色图像中提取装备（道具、服装、配饰），将其保存为可重复使用的物品，然后通过应用所选装备 + 姿势/表情控制，利用 AI 图像生成技术生成新的角色 _Look_。

## 为什么选择 Forgery？

- **模块化资产**：将截图、Cosplay 照片或电影剧照转化为模块化资产。
- **快速原型设计**：通过混合搭配装备，快速原型设计多种角色 Look。
- **精细控制**：为生成的 Look 添加表情和姿势控制，获得更丰富的结果。

## 工作原理

1. **Extractor**：上传一张图片。Forgery 会分析它以识别并提取装备（服装、武器、配饰）。
2. **Create Character**：上传一张角色的基础肖像。
3. **Fitting Room**：将你的角色与所选装备结合，选择姿势并设定表情。
4. **Generate**：观看 Forgery 为你的角色生成新的 Look。

## 快速开始

### 前提条件

- [Bun](https://bun.sh) 或 [Docker](https://www.docker.com/)
- OpenAI 或 Google Gemini 的 API 密钥

### 本地快速开始

```bash
git clone https://github.com/yourname/forgery.git
cd forgery
bun install
bun run prisma migrate dev  # 初始化本地 SQLite 数据库
bun run dev
# 服务器运行在 http://localhost:3000
```

### Docker 快速开始 (Compose)

如果你已经克隆了仓库或拥有 `docker-compose.yml` 文件：

```bash
docker compose up -d
# 服务器运行在 http://localhost:3000
```

### Docker 快速开始 (Standalone)

你可以直接运行最新版本，无需克隆仓库：

```bash
mkdir -p data
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name forgery \
  yilingj/forgery:latest
# 服务器运行在 http://localhost:3000
```

## 配置

Forgery 需要 AI 生成服务的 API 密钥（Google Gemini 和/或 OpenAI）。

1.  启动应用程序并转到 **Settings** 页面（通过侧边栏访问）。
2.  输入你的 **Google API Key** 和/或 **OpenAI API Key**。
3.  配置你偏好的文本和图像生成模型。

## 模型推荐

对于文本生成，Gemini 3 Flash 或 GPT-5 Mini 通常足以满足大多数用例。

对于图像生成，Nanao Banana Pro 提供最高质量的结果，通常是最佳选择。但是，如果考虑到成本，你可以考虑 Nano Banana (non-Pro) 或 GPT Image 1.5 作为更经济实惠的替代方案。

请记住，Nano Banana (non-Pro) 在 Look 生成步骤中可能会遇到困难，特别是当提示包含多个装备或复杂的视觉元素时。

## 数据备份

你的数据存储在本地 data 文件夹中。要备份你的库、角色资产和配置，只需复制 data 文件夹。

要恢复，请在启动应用程序之前将文件夹放回根目录（或你的 Docker 卷路径）。

## 架构概览

构建在现代技术栈上的模块化管道：

1. **Frontend** (React + Shadcn UI + Tailwind)
   - 上传 UI，装备库浏览器，Look 组合器 (Fitting Room)。
2. **API Server** (Hono on Bun)
   - 用于提取、装备 CRUD、角色 CRUD、生成的 REST API。
3. **Extraction Service**
   - 编排 AI 模型 (OpenAI/Gemini) 以分析图像并生成蒙版。
4. **Asset Store**
   - 本地文件系统 (`data/files`) 用于存储优化的 WebP 图像。
5. **DB** (SQLite + Prisma)
   - 存储元数据、关系、设置和生成历史。

## 许可证

[MIT](./LICENSE)
