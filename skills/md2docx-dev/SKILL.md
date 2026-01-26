---
name: md2docx-dev
description: "Md2Docx开发技能：包含项目开发环境配置、前后端启动、调试技巧、代码规范。用于新开发者快速上手、日常开发任务、问题排查。"
---

# md2docx-dev Skill

快速搭建Md2Docx开发环境，理解项目结构，高效进行日常开发和调试。

## When to Use This Skill

触发此技能当你需要：
- 配置开发环境并启动项目
- 理解项目代码结构
- 调试前后端问题
- 添加新功能或修复Bug
- 运行测试和验证

## Not For / Boundaries

此技能不包括：
- 生产环境部署配置
- Electron打包发布流程
- 用户功能使用指南

必需输入：
- 已安装Node.js 18+和Python 3.10+
- 已克隆项目仓库

## Quick Reference

### 环境配置命令

**前端环境**：
```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:5173
```

**后端环境**：
```bash
# 创建虚拟环境
python -m venv venv

# 激活 (Windows)
.\venv\Scripts\activate

# 激活 (macOS/Linux)
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
# 访问 http://localhost:8000/docs
```

### 项目结构速查

```
md2docx/
├── frontend/                # 前端项目 (Vite + React)
│   ├── src/components/ui/   # UI组件库主工作台
│   │   ├── RuleEditor.tsx  # 规则编辑
│   │   ├── ComparisonPreview.tsx # 对比预览
│   │   └── BatchProcessing.tsx   # 批量处理
│   └── src/app/components/ui/    # 48个UI组件
├── docs/                    # 项目文档
├── skills/                  # 技能文档
└── main.py                  # 后端入口
```

### 核心组件职责

| 组件 | 职责 | 关键状态 |
|:---|:---|:---|
| `App.tsx` | 路由管理 | `currentView` |
| `Workspace` | 文件上传 | `selectedFiles`, `preset` |
| `RuleEditor` | 规则配置 | `rules`, `selectedRule` |
| `ComparisonPreview` | 对比预览 | `fixes`, `selectedElement` |
| `BatchProcessing` | 批量处理 | `files`, `processing` |

### 常用开发命令

**代码格式化**：
```bash
# Python
black .
ruff check .

# TypeScript/React
cd frontend
npx prettier --write .
npx eslint .
```

**Git提交规范**：
```bash
git commit -m "feat: 添加表格边框规则"
git commit -m "fix: 修复公式编号错位"
git commit -m "docs: 更新API文档"
```

### API调试

**测试上传**：
```bash
curl -X POST "http://localhost:8000/api/upload" \
  -F "file=@test.md"
```

**测试处理**：
```bash
curl -X POST "http://localhost:8000/api/process" \
  -H "Content-Type: application/json" \
  -d '{"document_id": "doc_123", "preset": "corporate"}'
```

### VS Code调试配置

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI Debug",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["main:app", "--reload", "--port", "8000"]
    }
  ]
}
```

### 常见问题速查

| 问题 | 解决方案 |
|:---|:---|
| `ENOENT` | `npm install` |
| `ModuleNotFoundError` | 激活venv后 `pip install -r requirements.txt` |
| CORS错误 | 检查后端CORS配置允许`localhost:5173` |
| 文件上传失败 | 检查文件类型白名单和大小限制 |

## Examples

### Example 1: 添加新UI组件

- Input: 需要添加一个新的设置页面组件
- Steps:
  1. 在`components/`创建`Settings.tsx`
  2. 导入必要的UI组件
  3. 在`App.tsx`添加路由case
  4. 在侧边栏添加导航项
- Acceptance: 点击设置导航可切换到新页面

### Example 2: 添加新API端点

- Input: 需要添加规则导出API
- Steps:
  1. 在`api/routes.py`添加新路由
  2. 定义Pydantic请求/响应模型
  3. 实现业务逻辑
  4. 更新API文档
- Acceptance: `/docs`显示新端点且可正常调用

### Example 3: 调试规则不生效

- Input: 规则配置正确但文档未被修复
- Steps:
  1. 检查规则`enabled`是否为`true`
  2. 使用`/api/rules/test`测试匹配
  3. 检查选择器条件是否正确
  4. 查看后端日志定位问题
- Acceptance: 规则正确匹配并执行

## References

- [开发指南](file:///e:/ilovendProject/Md2Docx/docs/DEVELOPMENT.md)
- [前端架构](file:///e:/ilovendProject/Md2Docx/docs/FRONTEND.md)
- [后端架构](file:///e:/ilovendProject/Md2Docx/docs/BACKEND.md)
- [API文档](file:///e:/ilovendProject/Md2Docx/docs/API.md)

## Maintenance

- Sources: 项目docs/目录下的技术文档
- Last updated: 2026-01-26
- Known limits: Electron集成开发流程待补充
