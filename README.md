# Md2Docx - Word文档格式自动修复工具

[![构建状态](https://img.shields.io/github/actions/workflow/status/ilovend/md2docx/main.yml?style=for-the-badge)](https://github.com/ilovend/md2docx/actions)
[![许可证](https://img.shields.io/github/license/ilovend/md2docx?style=for-the-badge)](LICENSE)
[![最新版本](https://img.shields.io/github/v/release/ilovend/md2docx?style=for-the-badge)](https://github.com/ilovend/md2docx/releases)

> 专业的Word文档格式自动修复工具，告别Pandoc转换后的格式噩梦。

Md2Docx 是一个桌面应用程序，专门用于解决从Markdown等格式通过Pandoc转换为Word文档后出现的各种格式问题。工具能够自动检测并修复文档中的格式错误，使其符合商务文档的专业标准。

## ✨ 核心特性

- **🔧 智能表格修复**：自动识别并重建表格结构，标准化边框样式和单元格间距
- **📐 LaTeX公式支持**：自动将文档中的LaTeX公式转换为原生Word公式(OMML)，支持行内和独立公式
- **📝 排版优化**：统一字体和段落样式，标准化标题级别，调整行间距和缩进
- **🧪 规则测试工作台**：内置Markdown编辑器，支持实时测试和验证规则配置效果，所见即所得
- **🖼️ 图表处理**：Mermaid流程图渲染，图片尺寸优化，自动添加图表标题
- **📊 批量处理**：支持大规模文档自动化处理，一键打包下载所有修复结果
- **🔍 实时预览**：左右分栏对比原始与修复后的文档，高亮显示所有变更
- **⚙️ 规则引擎**：灵活的YAML配置，支持自定义修复规则，规则导入/导出

## 🖥️ 界面预览

|   主工作台   |  规则编辑器  |   对比预览   |
| :----------: | :----------: | :----------: |
| 文件拖拽上传 | YAML规则配置 | 修改高亮对比 |
| 预设快速选择 | 规则实时测试 | 修复摘要统计 |

## 🛠️ 技术栈

| 组件         | 技术选型                      |
| :----------- | :---------------------------- |
| **前端界面** | Electron + React + TypeScript |
| **后端服务** | Python + FastAPI              |
| **文档处理** | python-docx                   |
| **规则引擎** | 自定义YAML规则架构            |
| **UI组件**   | Radix UI + Tailwind CSS       |

## 🚀 快速上手

### 先决条件

开始之前，请确保您已安装好以下环境：

- Node.js 18+ (前端开发)
- Python 3.10+ (后端服务)
- pnpm 或 npm (包管理器)

### 安装

1. 克隆本仓库

   ```sh
   git clone https://github.com/ilovend/md2docx.git
   cd md2docx
   ```

2. 安装前端依赖

   ```sh
   cd frontend
   npm install
   ```

3. 安装后端依赖
   ```sh
   pip install -r requirements.txt
   ```

### 运行开发环境

**启动前端开发环境**：

```sh
cd frontend
npm run dev
```

**启动后端服务**：

```sh
python -m uvicorn backend.main:app --reload
```

### 运行测试

```sh
# 运行完整自动化测试套件
python scripts/run_tests.py

# 仅运行后端测试
python -m pytest backend/tests/test_api.py -v
```

## 📚 文档

> 📌 **文档真源入口**：[docs/index.md](./docs/index.md) - 所有文档的唯一索引

- [**设计文档**](./DESIGN_DOC.md) - 了解项目目标、技术选型和高阶架构
- [**架构文档**](./ARCHITECTURE.md) - 深入了解系统技术实现细节
- [**前端架构**](./docs/FRONTEND.md) - 前端界面组件和状态管理
- [**后端架构**](./docs/BACKEND.md) - FastAPI服务和API设计
- [**规则引擎**](./docs/RULE_ENGINE.md) - YAML规则配置详解
- [**API接口**](./docs/API.md) - RESTful API和IPC接口规范
- [**开发指南**](./docs/DEVELOPMENT.md) - 开发环境配置和调试
- [**功能清单**](./docs/FEATURES.md) - 完整功能列表和优先级
- [**架构决策记录**](./docs/adr/) - 关键技术决策及其背景
- [**贡献指南**](./CONTRIBUTING.md) - 如何为本项目贡献代码

## 📁 项目结构

```
md2docx/
├── .githooks/               # Git钩子脚本
│   ├── commit-msg           # 提交消息验证
│   └── pre-commit           # 提交前检查
├── .github/                 # GitHub配置
│   ├── workflows/           # CI/CD工作流
│   │   └── ci.yml           # 持续集成配置
│   └── PULL_REQUEST_TEMPLATE.md  # PR模板
├── backend/                 # Python后端服务
│   ├── api/                 # API路由和模式
│   │   ├── __init__.py
│   │   ├── routes.py        # API路由定义
│   │   └── schemas.py       # 数据模型模式
│   ├── core/                # 核心功能模块
│   │   ├── __init__.py
│   │   ├── config.py        # 配置管理
│   │   ├── latex_converter.py  # LaTeX公式转换
│   │   ├── markdown_converter.py  # Markdown转换
│   │   ├── preview_converter.py  # 预览转换
│   │   └── processor.py     # 文档处理器
│   ├── engine/              # 规则引擎
│   │   ├── __init__.py
│   │   └── parser.py        # 规则解析器
│   ├── outputs/             # 输出目录
│   ├── tests/               # 后端测试
│   │   └── test_api.py      # API测试
│   ├── uploads/             # 上传文件目录
│   ├── __init__.py
│   ├── main.py              # 后端主入口
│   └── requirements.txt     # 后端依赖
├── docs/                    # 详细文档
│   ├── adr/                 # 架构决策记录
│   ├── changelog/           # 变更日志
│   ├── decisions/           # 决策记录
│   │   └── adr/             # 架构决策记录
│   ├── design/              # 设计文档
│   ├── prompts/             # 提示模板
│   ├── requirements/        # 需求文档
│   ├── retros/              # 回顾记录
│   ├── sessions/            # 会议记录
│   ├── API.md               # API文档
│   ├── BACKEND.md           # 后端文档
│   ├── DEVELOPMENT.md       # 开发指南
│   ├── FEATURES.md          # 功能清单
│   ├── FRONTEND.md          # 前端文档
│   ├── RULE_ENGINE.md       # 规则引擎文档
│   ├── index.md             # 文档索引
│   ├── parallel-backlog.md  # 并行任务
│   └── working-agreement.md # 工作协议
├── frontend/                # Vite + React + TypeScript 前端项目
│   ├── .husky/              # Git钩子
│   ├── dist-electron/       # Electron构建输出
│   ├── electron/            # Electron主进程和预加载脚本
│   │   ├── main/            # 主进程
│   │   └── preload/         # 预加载脚本
│   ├── public/              # 静态资源
│   ├── src/                 # 前端源代码
│   │   ├── assets/          # 资源文件
│   │   ├── components/      # UI组件
│   │   │   └── ui/          # 基础UI组件
│   │   ├── i18n/            # 国际化
│   │   ├── layouts/         # 布局组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API服务
│   │   ├── stores/          # 状态管理
│   │   ├── styles/          # 样式文件
│   │   ├── tests/           # 前端测试
│   │   └── types/           # 类型定义
│   ├── .env.development     # 开发环境变量
│   ├── .env.production      # 生产环境变量
│   ├── eslint.config.js     # ESLint配置
│   ├── index.html           # HTML入口
│   ├── package.json         # 前端依赖
│   ├── tsconfig.app.json    # TypeScript配置
│   ├── tsconfig.json        # TypeScript配置
│   ├── tsconfig.node.json   # TypeScript配置
│   └── vite.config.ts       # Vite配置
├── scripts/                 # 脚本文件
│   ├── run_tests.py         # 运行测试脚本
│   └── verify.sh            # 验证脚本
├── skills/                  # 技能模块
│   ├── article_scraper/     # 文章抓取器
│   ├── claude-skills/       # Claude技能
│   ├── md2docx-dev/         # 开发技能
│   └── md2docx-rules/       # 规则技能
├── tests/                   # 测试目录
│   ├── test_rule_saving.py  # 规则保存测试
│   ├── verify_batch_zip_api.py  # 批量压缩API测试
│   ├── verify_latex.py      # LaTeX验证
│   └── verify_rule_test_api.py  # 规则测试API验证
├── .env.example             # 环境变量示例
├── .gitignore               # Git忽略文件
├── ARCHITECTURE.md          # 架构文档
├── CHANGELOG.md             # 变更日志
├── CODE_OF_CONDUCT.md       # 行为准则
├── CONTRIBUTING.md          # 贡献指南
├── DESIGN_DOC.md            # 设计文档
├── LICENSE                  # 许可证
├── README.md                # 本文件
└── presets.yaml             # 预设配置
```

## 🤝 贡献

我们非常欢迎各种形式的贡献！请阅读 [**CONTRIBUTING.md**](./CONTRIBUTING.md) 来了解如何参与。

## 📄 许可证

本项目使用 MIT 许可证。详情请见 [LICENSE](./LICENSE) 文件。

---

<p align="center">
  <sub>使用 ❤️ 和 ☕ 构建</sub>
</p>
