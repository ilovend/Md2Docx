---
name: md2docx-rules
description: "Md2Docx规则配置技能：编写YAML格式的文档格式修复规则，包括表格、公式、排版、图表四大类规则的配置语法和最佳实践。用于创建新规则、调试规则匹配、优化规则性能。"
---

# md2docx-rules Skill

编写和管理Md2Docx的YAML格式规则配置，确保规则准确匹配目标元素并正确执行修复操作。

## When to Use This Skill

触发此技能当你需要：

- 创建新的文档格式修复规则
- 调试规则匹配失败问题
- 优化规则执行性能
- 理解YAML规则配置语法
- 创建或修改预设配置

## Not For / Boundaries

此技能不包括：

- python-docx的底层API使用（参见后端架构文档）
- 前端规则编辑器UI开发（参见前端架构文档）
- 规则引擎核心代码开发（参见规则引擎设计文档）

必需输入：

- 目标文档元素类型（表格/段落/图片等）
- 期望的修复效果
- 可选：示例文档片段

## Quick Reference

### 规则基础结构

```yaml
id: rule_unique_id # 规则唯一标识
name: 规则显示名称 # 人类可读名称
description: 规则功能描述 # 详细说明
category: tables # 分类: tables/formulas/typography/images
version: 1.0.0 # 版本号
enabled: true # 是否启用
priority: 10 # 优先级(数字越小越先执行)

selector: # 选择器定义
  type: table # 元素类型
  conditions: [] # 匹配条件

actions: # 修复操作
  - type: set_style # 操作类型
    params: {} # 操作参数
```

### 选择器类型

**按元素类型选择**：

```yaml
selector:
  type: table # table, paragraph, image, heading, list
```

**按样式选择**：

```yaml
selector:
  type: paragraph
  conditions:
    - field: style.name
      operator: equals
      value: "Heading 1"
```

**按内容选择**：

```yaml
selector:
  type: paragraph
  conditions:
    - field: content
      operator: contains
      value: "$$"
```

**复合条件(AND)**：

```yaml
selector:
  type: table
  conditions:
    - field: rows
      operator: greater_than
      value: 1
    - field: style.border
      operator: is_null
  match_all: true
```

### 条件运算符

| 运算符         | 说明     | 示例值        |
| :------------- | :------- | :------------ |
| `equals`       | 等于     | `"Heading 1"` |
| `not_equals`   | 不等于   | `"Normal"`    |
| `contains`     | 包含     | `"$$"`        |
| `starts_with`  | 开头是   | `"##"`        |
| `ends_with`    | 结尾是   | `".md"`       |
| `matches`      | 正则匹配 | `"^\\d+\\."`  |
| `greater_than` | 大于     | `10`          |
| `less_than`    | 小于     | `100`         |
| `is_null`      | 为空     | (无需value)   |
| `is_not_null`  | 非空     | (无需value)   |

### 操作类型

**设置样式**：

```yaml
actions:
  - type: set_style
    params:
      font_name: "宋体"
      font_size: 12
      bold: false
      color: "000000"
      border: "1px solid #000"
```

**添加内容**：

```yaml
actions:
  - type: add_content
    params:
      position: after # before, after, replace
      content: "图 {index}"
      style: "Caption"
```

**替换内容**：

```yaml
actions:
  - type: replace_content
    params:
      pattern: "\\$\\$(.+?)\\$\\$"
      replacement: "{omml:$1}"
```

### 表格规则模板

```yaml
id: table_border_fix
name: 表格边框修复
category: tables
priority: 10

selector:
  type: table
  conditions:
    - field: style.border
      operator: is_null

actions:
  - type: set_style
    params:
      border: all
      border_style: single
      border_width: 4
      border_color: "000000"
```

### 标题规则模板

```yaml
id: heading_1_style
name: 一级标题样式
category: typography
priority: 10

selector:
  type: paragraph
  conditions:
    - field: style.name
      operator: equals
      value: "Heading 1"

actions:
  - type: set_style
    params:
      font_name: "黑体"
      font_size: 22
      bold: true
      spacing_before: 24
      spacing_after: 12
```

### 预设配置模板

```yaml
id: corporate
name: 企业标准预设
description: 适用于商务报告

rules:
  - id: table_border_fix
    enabled: true
    overrides:
      params:
        border_width: 4

  - id: heading_1_style
    enabled: true
    overrides:
      params:
        font_name: "微软雅黑"
```

## Examples

### Example 1: 创建表格样式规则

- Input: 需要统一表格表头背景色为浅灰色
- Steps:
  1. 确定选择器：选择所有表格的第一行
  2. 定义操作：设置背景色和字体样式
  3. 设置优先级：20（在边框规则之后执行）
- Expected output:

```yaml
id: table_header_style
name: 表格表头样式
category: tables
priority: 20

selector:
  type: table
  conditions:
    - field: rows
      operator: greater_than
      value: 0

actions:
  - type: set_row_style
    params:
      row_index: 0
      background: "f0f0f0"
      font_bold: true
```

### Example 2: 创建公式规则

- Input: LaTeX行间公式需要居中并添加编号
- Steps:
  1. 确定选择器：包含`$$`的段落
  2. 定义操作：转换公式格式、居中、添加编号
- Expected output:

```yaml
id: display_formula_style
name: 显示公式样式
category: formulas
priority: 15

selector:
  type: paragraph
  conditions:
    - field: content
      operator: matches
      value: "^\\$\\$[\\s\\S]+\\$\\$$"

actions:
  - type: convert_latex
    params:
      format: omml
  - type: set_style
    params:
      alignment: center
  - type: add_content
    params:
      position: after
      content: "({chapter}.{number})"
      style: "Formula Number"
```

### Example 3: 调试规则匹配

- Input: 规则未能匹配到预期的元素
- Steps:
  1. 检查选择器条件是否正确
  2. 验证字段名称拼写
  3. 测试单独条件是否匹配
  4. 检查`match_all`设置
- Acceptance: 使用规则测试API验证匹配结果

```bash
# 测试规则
curl -X POST "http://localhost:8000/api/rules/test" \
  -H "Content-Type: application/json" \
  -d '{
    "yaml_content": "...",
    "sample_content": "| A | B |",
    "sample_format": "markdown"
  }'
```

## References

- [规则引擎设计文档](file:///e:/ilovendProject/Md2Docx/docs/RULE_ENGINE.md)
- [API接口文档](file:///e:/ilovendProject/Md2Docx/docs/API.md)
- [后端架构文档](file:///e:/ilovendProject/Md2Docx/docs/BACKEND.md)

## Maintenance

- Sources: 项目docs/RULE_ENGINE.md规范
- Last updated: 2026-01-26
- Known limits: 规则验证脚本尚未实现，需手动测试
