# Md2Docx Skills

本目录包含Md2Docx项目的技能文档，用于辅助AI助手和开发者快速完成特定任务。

## 技能列表

| 技能                                  | 说明                | 使用场景                   |
| :------------------------------------ | :------------------ | :------------------------- |
| [claude-skills](./claude-skills/)     | Claude Skills元技能 | 创建新技能、重构现有技能   |
| [md2docx-rules](./md2docx-rules/)     | 规则配置技能        | 编写YAML规则、调试规则匹配 |
| [md2docx-dev](./md2docx-dev/)         | 开发技能            | 环境配置、日常开发、调试   |
| [article_scraper](./article_scraper/) | 文章抓取技能        | 网页内容提取               |

## 技能结构

每个技能目录包含：

```
skill-name/
├── SKILL.md              # 技能入口(必需)
├── references/           # 参考文档(可选)
├── scripts/              # 辅助脚本(可选)
└── assets/               # 模板资源(可选)
```

## 使用方式

1. 阅读对应技能的`SKILL.md`文件
2. 根据"When to Use"确认适用场景
3. 参考"Quick Reference"获取常用模式
4. 查看"Examples"了解完整用法

## 创建新技能

参考 `claude-skills/SKILL.md` 的模板和规范创建新技能。

基本骨架：

```yaml
---
name: my-skill
description: "技能简述: 包含[能力1], [能力2]。用于[触发条件]。"
---
```

## 相关文档

- [项目README](../README.md)
- [规则引擎设计](../docs/RULE_ENGINE.md)
- [开发指南](../docs/DEVELOPMENT.md)
