# 🚀 Nova ERP (新星 ERP)

Nova ERP 是一个专为现代商贸与轻量级制造企业打造的极速、轻量、全栈业财一体化 SaaS 平台。抛弃传统进销存系统臃肿的历史包袱，Nova ERP 采用最新的 Web 全栈架构（Next.js App Router + Server Actions + Prisma），实现了从订单录入、库存计价到自动复式记账的完美闭环。

## ✨ 核心特性 (Core Features)

### 📦 金融级库存引擎 (Inventory & Ledger)

- **防超卖预留机制 (Anti-Overselling)**：销售建单即锁定可用库存 (Reserved Qty)，在多并发场景下绝对防止爆仓。
- **智能计价引擎 (Moving Average Valuation)**：系统根据历次采购入库单价，自动计算移动加权平均成本，精确核算销售毛利。
- **绝对原子性 (Transaction Integrity)**：出入库动作与底层的 T 型账户财务凭证在同一个数据库事务 ($transaction) 中生成，不平不入账，同生共死。

### 💰 业财一体化 (Business-Finance Integration)

- **自动日记账 (Automated Journal Entries)**：业务单据完成时，后台自动生成复式记账凭证（借/贷）。
- **时光倒流冲销 (Cancel Reversal)**：一键撤销已完成的订单。系统将自动追溯历史出库单价，恢复库存价值，并生成纯净的红字冲销流水。

### 🛡️ 企业级权限与体验 (Security & UX)

- **RBAC 动态鉴权**：支持多种角色设定，左侧折叠菜单与路由严密配合，隔离数据敏感度。
- **暗黑模式 & 高保真打印**：原生支持深色模式 (Dark Mode)，利用 CSS 原生媒体查询实现极其工整的 A4 单据打印输出。

## 🏗️ 系统架构图 (Architecture)

```
[ 前端 UI ] (React Server Components + Tailwind CSS)
        │
        ▼
[ Server Actions ] (零 API 路由的高性能服务器端数据变更)
        │
        ├─▶ 库存预留校验引擎
        ├─▶ 移动加权均价核算
        └─▶ 自动财务日记账生成
        │
        ▼
[ Prisma ORM ] (强类型数据库操作 + 严格的事务一致性)
        │
        ▼
[ PostgreSQL ] (底层关系型数据存储)
```

## 🛠️ 本地开发与启动

```bash
git clone https://github.com/dzuqiu-wq/erpnext-modern.git
cd erpnext-modern
npm install
npx prisma db push
npm run dev
```

## 💖 支持与赞助 (Sponsor)

Nova ERP 的开源与维护耗费了大量的个人心血。如果这个项目帮助你接到了私单、提升了企业效率，或者单纯觉得代码写得不错，欢迎请作者喝杯咖啡！你的支持是我持续迭代的最大动力。

### 1. Web3 加密货币打赏

非常欢迎使用 Web3 赞助（转账前请核对网络类型）：

| 项目 | 信息 |
|------|------|
| **Network** | BNB Smart Chain (BSC / BEP20) |
| **Token** | USDC |
| **Address** | `0x76267A465fCd5DF51d006B8442FFB2a44984DA4f` |

### 2. 微信扫码赞助

| 微信赞助 (WeChat Pay) |
| :---: |
| <img src="wechat-pay.png" width="200" alt="WeChat Pay" /> |
| *扫一扫，备注"Nova ERP"* |

## � License

MIT License
