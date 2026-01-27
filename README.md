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

| 主工作台 | 规则编辑器 | 对比预览 |
|:---:|:---:|:---:|
| 文件拖拽上传 | YAML规则配置 | 修改高亮对比 |
| 预设快速选择 | 规则实时测试 | 修复摘要统计 |

## 🛠️ 技术栈

| 组件 | 技术选型 |
|:---|:---|
| **前端界面** | Electron + React + TypeScript |
| **后端服务** | Python + FastAPI |
| **文档处理** | python-docx |
| **规则引擎** | 自定义YAML规则架构 |
| **UI组件** | Radix UI + Tailwind CSS |

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
├── frontend/                # Vite + React + TypeScript 前端项目
│   ├── src/
│   │   ├── components/      # UI 组件和通用组件
│   │   ├── pages/           # 页面组件
│   │   ├── stores/          # Zustand 状态管理
│   │   ├── services/        # API 服务
│   │   └── layouts/         # 布局组件
│   ├── vite.config.ts
│   └── package.json
├── docs/                    # 详细文档
│   ├── adr/                 # 架构决策记录
│   ├── FRONTEND.md
│   ├── BACKEND.md
│   └── ...
├── main.py                  # Python后端入口
├── ARCHITECTURE.md          # 架构文档
├── DESIGN_DOC.md           # 设计文档
└── README.md               # 本文件
```

## 🤝 贡献

我们非常欢迎各种形式的贡献！请阅读 [**CONTRIBUTING.md**](./CONTRIBUTING.md) 来了解如何参与。

## 📄 许可证

本项目使用 MIT 许可证。详情请见 [LICENSE](./LICENSE) 文件。

---

<p align="center">
  <sub>使用 ❤️ 和 ☕ 构建</sub>
</p>
