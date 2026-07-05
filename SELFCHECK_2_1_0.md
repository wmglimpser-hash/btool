# SELFCHECK_2_1_0 · 2.1.0 设计规范收敛自查

> 自查时间：2026-07-05 | 自查仓库：E:\Projects\btool | HEAD：02f1f8e

## 三项硬性验收

### 1. git log 有 2.1.0 提交
```
02f1f8e feat: D15 设计规范收敛 2.1.0 - 色阶3级/字阶4级/间距8px/组件三态，主案例卡浮起，红色克制，折叠行补摘要
```
- 结果：✅ 通过

### 2. grep --surface-bg index.html 有命中
```
15: --surface-bg:#f0ead9;
93: var(--surface-bg);
```
- 结果：✅ 通过（:root 定义 + body 引用）

### 3. screenshots/ 有图
```
E:\Projects\btool\screenshots\
  desktop-before.png
  desktop-before-full.png
  mobile-before.png
  desktop-after.png
  desktop-after-full.png
  mobile-after.png
```
- 结果：✅ 通过（before=2.0.0, after=2.1.0）

## 设计规范落地自查

| 规范项 | 变量 | 命中 | 状态 |
|--------|------|------|------|
| 色阶 3 级 | --surface-bg / --surface-desk / --surface-float | ✅ | 已写入 :root |
| 墨色 3 级 | --ink-1 / --ink-2 / --ink-3 | ✅ | 已写入 :root |
| 字阶 4 级 | --fs-title/heading/body/caption | ✅ | 已写入 :root |
| 字距归正 | --ls-title/heading/body/caption | ✅ | 已写入 :root |
| 间距 8px | --sp-xs/sm/md/lg/xl | ✅ | 已写入 :root |
| 阴影 3 级 | --shadow-sm/md/lg | ✅ | 已写入 :root |
| 圆角 3 级 | --r-sm/md/lg | ✅ | 已写入 :root |
| 组件高度 3 级 | --h-sm/md/lg | ✅ | 已写入 :root |

## 收敛内容自查

| 收敛项 | 验证方式 | 状态 |
|--------|----------|------|
| 主案例卡浮起 | hero-case-card 使用 --surface-float + 三层阴影 + translateY(-2px) | ✅ |
| 字距归正 | hero-summary letter-spacing:0 | ✅ |
| tab/chip/button 统一 | scenario-tab/case-file-settings/theme-preset/generate-btn 高度 28px | ✅ |
| 5 个折叠行补产物摘要 | pack-collapsible-summary 存在于 5 个 pack | ✅ |
| 红色只留主 CTA 与印章 | scenario-tab.active 改墨黑；generate-btn 改墨色；pack 签条改墨色 | ✅ |
| 移动端空书封降权 | hero-cover height:56px + opacity:.7 + saturate(.8) | ✅ |

## 功能不回退自查（Playwright 3/3）

| 测试 | 结果 |
|------|------|
| 桌面端功能（heroCaseCard + 5 pack + CTA + API配置 + 原文 + 声明 + 去边框 + ZCOOL字体） | ✅ |
| LLM 500 失败态（保留 DOM + 重试按钮） | ✅ |
| 移动端 390x844（无横溢 + CTA 首屏可见） | ✅ |

## 骨架不动自查

| 保留项 | 状态 |
|--------|------|
| 2.0.0 功能结构（hero-case-card + 5 pack-collapsible） | ✅ 不变 |
| API 逻辑（方案A LLM直连 + 失败态保留DOM + LLM/后端模式区分） | ✅ 不变 |
| 真实文字生成（_generateWithLLM + JSON mode） | ✅ 不变 |
| 阅读器工作台（#sidePanel） | ✅ 不变 |
| API 协议 | ✅ 不变 |
| localStorage 安全提示 | ✅ 不变 |

## 结论

2.1.0 设计规范收敛已真正落盘到 E:\Projects\btool，三项硬性验收全部通过。
