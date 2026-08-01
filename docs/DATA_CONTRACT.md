# Dashboard 数据契约与指标口径

> 当前真实样本版的大屏口径以 [大屏真实数据接入与指标溯源](REAL_DATA_METRIC_PROVENANCE.md) 为准。下述双方对账和金额字段是未来获得对侧话单、资费表与结算规则后的目标契约；在这些数据到齐前，不得把目标字段解释为真实生产指标。

## 设计目标

页面组件不感知数据来自 Mock、DataEase 还是业务 API。任意适配器都必须返回同一 Dashboard View Model，确保更换数据源时不重写页面。

```js
await dashboardDataAdapter.loadDashboardData({
  range: '7',
  direction: 'ALL',
})
```

## 核心字段

| 字段 | 类型 | 说明 |
|---|---:|---|
| `date` | `YYYY-MM-DD` | 统计日期 |
| `direction` | enum | `GD_TO_HK`、`HK_TO_GD` |
| `completedCount` | integer | 已完成双方比对的话单数 |
| `anomalyCount` | integer | 命中至少一条规则的话单数 |
| `totalBytes` | integer | 漫游流量，底层统一使用 bytes |
| `differenceAmount` | number | 双方金额差异绝对值，人民币 |
| `gdReceivable` | number | 香港用户在广东漫游形成的结算收入 |
| `hkPayable` | number | 广东用户在香港漫游形成的结算支出 |

## 指标公式

```text
异常率 = 异常话单数 ÷ 已完成稽核话单数 × 100%
结算净额 = 漫游结算收入 - 漫游结算支出
流量差异率 = |广东侧流量 - 香港侧流量| ÷ max(双方流量) × 100%
```

漫游方向由“用户归属地 + 实际上网地”决定；GGSN 来源只用于交叉校验，不能作为唯一判断依据。

## 高价值 Demo 阈值

任一条件命中即纳入高价值风险话单：

- 计费金额不低于 ¥100；
- 总流量不低于 10 GB；
- 差异金额不低于 ¥30。

正式接入时阈值必须配置化并由业务团队确认。

## 演示数据要求

- 固定 Seed：`20260729`；
- 手机号码只保存脱敏形式；
- KPI、趋势和分布必须从同一批源数据聚合；
- 覆盖单位换算、方向标识、重复计费、流量不一致、金额偏差和话单缺失；
- 页面显著标注“演示数据”，禁止将测算结果描述为真实生产收益。
