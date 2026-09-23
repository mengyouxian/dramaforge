# DramaForge

DramaForge 把中文小说或剧本改编成面向海外的短剧剧本：上传、改编、在浏览器里改稿、导出。按积分计量。当前阶段是 **Demo**，没有真实支付。

> DramaForge helps you adapt Chinese stories into overseas short-drama scripts—upload, adapt, edit, export.

产品与技术真源在 [`docs/`](docs/)（版本 **v0.1.0**，见 [`docs/VERSION`](docs/VERSION)）。三份文档要一起改。

## 重要：上线前校准积分（calibrate before launch）

定价页上的 **$0 / $29.99 / $59.99** 和积分池（约 15 万、约 90 万、Business 更高额度）都是**占位**，没有用真实模型账单校验过。

上线前用实测 **p50 / p90** 成本重算，再对外承诺：

```
credit_usd   = 月费美元 / 月积分
raw_cost_usd = input_tokens * in_price + output_tokens * out_price
credits      = ceil(raw_cost_usd * SAFETY_MARGIN / credit_usd)
SAFETY_MARGIN >= 2
```

环境变量 `CREDITS_SAFETY_MARGIN`（默认 2）留给这条公式。当前任务走的是固定档：`CREDITS_PER_1K_INPUT_CHARS`（默认每 1,000 个提取字符 1,500 积分，最低 3,000）。多世界观对比再乘 1.4。这些数字不是生产计费的最终真相。

## 积分规则（与技术文档一致）

- 创建任务前：余额 < 预估消耗 → **不创建任务、不调用模型**（`INSUFFICIENT_CREDITS`）
- 余额足够：事务里预扣，流水原因 `job_reserve`
- 成功：按预扣金额结清，写 `job_settle`（固定档不再追加扣费）
- 失败或超时：退回预扣的 **80%**（`job_refund`），20% 留下，界面会说明
- 导出 TXT / DOCX / PDF：**不扣积分**
- 界面顶栏常显余额

## 没有 LLM Key 也能演示

`LLM_PROVIDER=seed`，或 `LLM_API_KEY` 为空时，走内置 **SeedProvider**，不访问外网模型。样例原文：[`fixtures/sample-chapter.txt`](fixtures/sample-chapter.txt)。

建议路径：落地页 → 定价 → 注册 → 新建任务（上传上面的 txt）→ 等种子稿 → 改一句并保存 → 导出 TXT / DOCX / PDF → 账户页看流水。Demo 模式下可以「补充 Demo 积分」或「模拟 Pro / Business」。Business 的多世界观对比会生成 **1 份完整稿 + 3 个标题位**（不是四份全文）。

积分为 0（或低于最低预扣）时，新建任务页会挡住，接口也会拒绝。

## 本地运行

包管理器用 **npm**。

```bash
cp .env.example .env
# 改 AUTH_SECRET

docker compose up -d
npm install
npx prisma migrate deploy
npm run dev
```

打开 <http://localhost:3000>（会转到 `/en`，中文营销在 `/zh`）。

没有 Docker 时，本机 Postgres 使用同一条连接串：

```
postgresql://dramaforge:dramaforge@localhost:5432/dramaforge
```

验收构建：

```bash
npm run build
```

## 环境变量

| 变量 | 作用 |
| --- | --- |
| `DATABASE_URL` | Postgres |
| `AUTH_SECRET` | 会话签名。也接受 `NEXTAUTH_SECRET` |
| `DEMO_MODE` | `true` 才开放发积分和模拟套餐。生产必须是 `false`（路由直接 404） |
| `LLM_PROVIDER` | `seed` 或 `openai_compatible` |
| `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | OpenAI 兼容接口。没有 key 就用种子引擎 |
| `STORAGE_DRIVER` | 仅实现 `local` |
| `STORAGE_LOCAL_PATH` | 默认 `./.data/storage` |
| `CREDITS_PER_1K_INPUT_CHARS` | 固定档单价（占位） |
| `CREDITS_SAFETY_MARGIN` | 代币成本公式的安全垫，保持 ≥ 2 |
| `PDF_FONT_PATH` | 可选。指向覆盖中日韩字符的 TTF/OTF，PDF 导出才会嵌入该字体 |
| `CREEM_API_KEY` / `CREEM_WEBHOOK_SECRET` | 预留给以后的 Creem。现在的 `/api/billing/webhook` 只验签，不扣款、不发积分 |

## 技术栈

Next.js App Router、TypeScript、Tailwind、shadcn/ui 风格组件、Prisma、Postgres、邮箱密码会话。支付是 stub。
