# Nova ERP 部署指南

## 部署方式

### 方式一：完整复制所有源码文件（推荐）

从 GitHub 拉取所有文件后，在服务器上执行：

```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma 客户端
npx prisma generate

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接

# 4. 初始化数据库
npx prisma db push

# 5. 填充种子数据（可选）
npx prisma db seed

# 6. 构建生产版本
npm run build

# 7. 启动应用
npm start
```

### 方式二：生产环境优化部署

```bash
# 只安装生产依赖（跳过测试相关）
npm install --omit=dev

# 但需要保留 Prisma CLI（用于数据库迁移）
npm install --save-dev prisma

# 构建
npm run build

# 启动
NODE_ENV=production npm start
```

## 前置条件

### 1. 数据库（PostgreSQL）

需要先准备好 PostgreSQL 数据库：

```sql
-- 创建数据库
CREATE DATABASE erpnext_modern;
```

### 2. 环境变量配置

创建 `.env` 文件：

```env
# 数据库连接（必须）
DATABASE_URL="postgresql://用户名:密码@主机:5432/erpnext_modern?schema=public"

# NextAuth 密钥（必须）- 生成方法：openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. 系统要求

- **Node.js**: >= 18.17.0
- **PostgreSQL**: >= 14.0
- **npm** 或 **pnpm** 或 **yarn**

## 生产环境启动

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start

# 或使用 PM2 进程管理器（推荐）
npm install -g pm2
pm2 start npm --name "nova-erp" -- start
```

## Docker 部署（可选）

在项目根目录创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

构建运行：
```bash
docker build -t nova-erp .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  nova-erp
```

## 部署检查清单

- [ ] PostgreSQL 数据库已创建
- [ ] `.env` 文件已配置
- [ ] `npm install` 成功
- [ ] `npx prisma generate` 成功
- [ ] `npx prisma db push` 成功
- [ ] `npm run build` 成功
- [ ] 应用可访问

## 初始账号

部署后访问系统，使用以下凭证登录：

- **邮箱**: admin@erpnext.com
- **密码**: admin

> ⚠️ 首次部署后建议立即修改密码！

## 常见问题

### Q: 数据库连接失败
检查 `.env` 中的 `DATABASE_URL` 格式，确保数据库服务正在运行。

### Q: Prisma 迁移错误
确保数据库已创建，且连接用户有足够权限。

### Q: 端口被占用
修改 `package.json` 或使用环境变量 `PORT=3001 npm start`
