# 📚 Md2Docx 文档中心 (单一真源)

> **维护原则**：此文件是项目文档的唯一入口，所有文档必须在此注册。
> **最后更新**：2026-01-26

---

## 🎯 项目目标

构建一款专业的 Word 文档格式自动修复工具，解决 Markdown 转 Word 后的格式问题。

---

## 📁 文档索引

### 需求文档 (Requirements)

| 编号    | 标题     | 链接                         | 状态    |
| :------ | :------- | :--------------------------- | :------ |
| REQ-001 | 功能清单 | [FEATURES.md](./FEATURES.md) | ✅ 有效 |

---

### 设计文档 (Design)

| 编号       | 标题         | 链接                                     | 状态    |
| :--------- | :----------- | :--------------------------------------- | :------ |
| DESIGN-001 | 项目设计文档 | [../DESIGN_DOC.md](../DESIGN_DOC.md)     | ✅ 有效 |
| DESIGN-002 | 系统架构文档 | [../ARCHITECTURE.md](../ARCHITECTURE.md) | ✅ 有效 |
| DESIGN-003 | 前端架构     | [FRONTEND.md](./FRONTEND.md)             | ✅ 有效 |
| DESIGN-004 | 后端架构     | [BACKEND.md](./BACKEND.md)               | ✅ 有效 |
| DESIGN-005 | 规则引擎设计 | [RULE_ENGINE.md](./RULE_ENGINE.md)       | ✅ 有效 |
| DESIGN-006 | API 接口规范 | [API.md](./API.md)                       | ✅ 有效 |
| DESIGN-007 | 开发指南     | [DEVELOPMENT.md](./DEVELOPMENT.md)       | ✅ 有效 |

---

### 架构决策记录 (ADR)

| 编号     | 标题                    | 链接                                                                                           | 状态      |
| :------- | :---------------------- | :--------------------------------------------------------------------------------------------- | :-------- |
| ADR-0000 | ADR 模板                | [0000-template.md](./decisions/adr/0000-template.md)                                           | 模板      |
| ADR-0001 | 记录架构决策            | [0001-record-architecture-decisions.md](./decisions/adr/0001-record-architecture-decisions.md) | ✅ 已接受 |
| ADR-0002 | Electron + FastAPI 架构 | [0002-electron-fastapi-architecture.md](./decisions/adr/0002-electron-fastapi-architecture.md) | ✅ 已接受 |

---

### 提示词库 (Prompts)

| 编号        | 标题       | 链接                                                   | 用途 |
| :---------- | :--------- | :----------------------------------------------------- | :--- |
| PROMPT-0000 | 提示词模板 | [prompts/0000-template.md](./prompts/0000-template.md) | 模板 |

---

### 会话记录 (Sessions)

| 日期 | 标题         | 链接                                                             | 关键产出 |
| :--- | :----------- | :--------------------------------------------------------------- | :------- |
| -    | 会话记录模板 | [sessions/YYYYMMDD-template.md](./sessions/YYYYMMDD-template.md) | 模板     |

---

### 迭代复盘 (Retros)

| 日期 | 标题     | 链接                                                         | 核心发现 |
| :--- | :------- | :----------------------------------------------------------- | :------- |
| -    | 复盘模板 | [retros/YYYYMMDD-template.md](./retros/YYYYMMDD-template.md) | 模板     |

---

### 变更日志 (Changelog)

| 编号 | 标题     | 链接                               | 状态    |
| :--- | :------- | :--------------------------------- | :------ |
| -    | 变更日志 | [../CHANGELOG.md](../CHANGELOG.md) | ✅ 有效 |

---

## 🔗 快速链接

- [README - 项目主页](../README.md)
- [CONTRIBUTING - 贡献指南](../CONTRIBUTING.md)
- [工作协议](./working-agreement.md)
- [并行任务清单](./parallel-backlog.md)

---

## ⚠️ 维护规则

1. **新增文档**：必须先在此索引中添加条目
2. **删除文档**：必须先在此索引中标记为 ❌ 已废弃
3. **移动文档**：必须同步更新此索引中的链接
4. **命名规范**：
   - 需求：`REQ-XXX-标题.md`
   - 设计：`DESIGN-XXX-标题.md`
   - ADR：`XXXX-标题.md` (4位数字)
   - 提示词：`PROMPT-XXXX-标题.md`
   - 会话：`YYYYMMDD-标题.md`
   - 复盘：`YYYYMMDD-retro.md`
