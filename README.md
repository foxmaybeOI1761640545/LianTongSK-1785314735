# 粤港一卡双号漫游话单智能稽核驾驶舱

面向“粤港一卡双号”漫游结算场景的 Vue 3 可视化大屏 Demo。页面围绕“发现异常 → 查看双方证据 → 量化金额影响 → 给出处置建议”组织信息，将合规稽核结果转化为可解释、可处置的经营洞察。

> 当前版本仅使用固定 Seed 的演示数据，不连接生产数据库，不包含真实用户号码，也不代表生产 AI 模型或 DataEase 正式数据源已经上线。

## 功能

- 六项核心 KPI 及口径提示；
- 话单总量、漫游流量和异常率趋势；
- 广东 ↔ 香港双向流向与全屏联动筛选；
- 异常类型分布、高价值风险话单 TOP 10；
- 广东侧与香港侧 CDR 证据对比抽屉；
- 结算收入、支出、净额及可追回金额演示测算；
- DCC/GGSN → 集中采集 → 分拣 → 稽核结算链路健康状态；
- 可暂停、继续和重启的现场演示导览；
- Mock、DataEase 与安全 API 数据适配边界。

## 本地开发

```bash
npm ci
npm run dev
```

## 检查与构建

```bash
npm run lint
npm run test:unit
npm run build
npm run verify:build
npx playwright install chromium
npm run test:e2e
npm run capture:local
```

`capture:local` 会在被 Git 忽略的 `test-results/visual/` 中生成 1920×1080、1600×900、1366×768 及异常详情抽屉截图，用于视觉验收。

## GitHub Pages

Vite 基础路径固定为 `/LianTongSK-1785314735/`。`.github/workflows/ci-pages.yml` 使用 GitHub 官方 Pages Artifact 流程部署，不创建 `gh-pages` 分支，不使用第三方部署 Action，也不需要将个人 PAT 保存为 Repository Secret。

预期地址：<https://foxmaybeoi1761640545.github.io/LianTongSK-1785314735/>

## 数据适配

UI 只调用统一入口：

```js
dashboardDataAdapter.loadDashboardData(filters)
```

默认实现为 `MockDataAdapter`。DataEase 未配置时不会发出伪生产请求，会明确显示演示数据状态并安全回退。正式接入方式见 [DataEase 接入说明](docs/DATAEASE_INTEGRATION.md)，字段与指标口径见 [数据契约](docs/DATA_CONTRACT.md)。

## 安全边界

- GitHub Pages 是完全公开的静态前端；
- 所有 `VITE_*` 变量都可能出现在浏览器构建产物中；
- 禁止在前端保存 GitHub PAT、DataEase APP Secret、数据库密码或服务端 Token；
- 需要动态签发 Token 或访问私有数据库时，必须增加后端或 Serverless 代理；
- 演示号码均已脱敏，数值由固定 Seed 生成，刷新不会随机漂移。

## 已知限制

- 当前粤港区域为业务流向示意，不是运营商生产 GIS；
- “智能稽核解释”由规则驱动，不代表生产 AI 模型；
- 正式 DataEase 数据源下发后仍需校准字段映射、鉴权方式、刷新频率和异常规则。
