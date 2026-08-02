# 粤港一卡双号漫游数据洞察驾驶舱

面向“粤港一卡双号”场景的 Vue 3 可视化大屏 Demo。页面使用真实话单的脱敏静态聚合，展示使用规模、流量集中度、数据质量和规则画像，并将缺少资费支撑的金额严格标注为情景估算。

> 当前版本不连接生产数据库，只展示真实号码的 `前三位 + **** + 后四位` 脱敏形式，不包含完整号码、IMSI、IP 或位置明细，也不代表生产 AI 模型或 DataEase 正式数据源已经上线。指标来源分层见 [大屏真实数据接入与指标溯源](docs/REAL_DATA_METRIC_PROVENANCE.md)。

## 功能

- 六项核心 KPI 及口径提示；
- 真实话单总量、漫游流量和跨期记录率趋势；
- 样本内广东侧用户 → 香港网络的单向流向与联动筛选；
- 数据质量信号、高价值用户画像 TOP 10；
- 不含可回溯标识的用户聚合画像抽屉；
- 显式标注假设计费单价的结算情景估算；
- 时间、流量解析、映射、月份与 IMEI 完整性检查；
- 可暂停、继续和重启的现场演示导览；
- 静态聚合、DataEase 与安全 API 数据适配边界。

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

默认实现为 `StaticSampleDataAdapter`。DataEase 未配置时不会发出伪生产请求，会显示真实样本的脱敏静态聚合。正式接入方式见 [DataEase 接入说明](docs/DATAEASE_INTEGRATION.md)，字段与指标口径见 [数据契约](docs/DATA_CONTRACT.md)。

## 安全边界

- GitHub Pages 是完全公开的静态前端；
- 所有 `VITE_*` 变量都可能出现在浏览器构建产物中；
- 禁止在前端保存 GitHub PAT、DataEase APP Secret、数据库密码或服务端 Token；
- 需要动态签发 Token 或访问私有数据库时，必须增加后端或 Serverless 代理；
- 仓库只保存脱敏聚合 JSON 和中间四位掩码号码，不提交原始 Excel、完整号码、IMSI、IP、PDP 地址或位置明细。

## 已知限制

- 当前粤港区域为业务流向示意，不是运营商生产 GIS；
- 用户画像和价值分由规则驱动，不代表生产 AI 模型或身份认定；
- 结算金额缺少资费支撑，只能作为情景估算；
- 正式 DataEase 数据源下发后仍需校准字段映射、鉴权方式、刷新频率和异常规则。
