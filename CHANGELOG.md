# 变更日志 (Changelog)

本项目所有重要变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [未发布] - Unreleased

### 新增 (Added)

- **Workspace 增强**
  - 单文件删除按钮（hover 显示 X）
  - 清空全部文件按钮
  - 严格模式开关（strict 参数）
  - 详细日志开关（verbose 参数）
- **ComparisonPreview 增强**
  - 批量模式文档切换器（左右箭头 + 下拉选择）
- **RuleEditor 增强**
  - YAML 实时验证（300ms 防抖）
  - Monaco markers 标注错误行
  - 保存按钮在 YAML 无效时禁用
  - 跳转到错误位置按钮
  - 新建规则模态框
- **规则引擎**
  - `display_formula_center` 公式居中规则
  - `font_replacement` 字体替换规则
  - `inline_formula_style` 行内公式样式规则
  - `image_resize` 图片尺寸调整规则
  - `image_caption` 图片标题规则
- **后端 API**
  - ProcessRequest 添加 strict/verbose 参数
  - processor 支持严格模式参数调整
  - verbose 模式返回规则执行日志
  - 前端 rulesApi 添加 CRUD 方法

### 变更 (Changed)

- 更新 ARCHITECTURE.md 目录结构以匹配当前代码
- 更新 presets.yaml：academic/comprehensive 预设启用更多规则

### 修复 (Fixed)

- 无

### 移除 (Removed)

- 无

---

## [0.1.0] - 2026-01-26

### 新增 (Added)

- 项目初始化
- Figma 导出的 React 前端原型
- 核心设计文档 (DESIGN_DOC.md)
- 架构文档 (ARCHITECTURE.md)
- 前端架构文档 (docs/FRONTEND.md)
- 后端架构文档 (docs/BACKEND.md)
- 规则引擎设计文档 (docs/RULE_ENGINE.md)
- API 接口文档 (docs/API.md)
- ADR 架构决策记录

---

> 📌 **提示**：每次版本发布时，将 [未发布] 部分重命名为版本号和日期，并创建新的 [未发布] 部分。
