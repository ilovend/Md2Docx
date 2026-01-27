# 开发指南

本文档提供Md2Docx的完整开发环境配置和开发流程指南。

---

## 1. 开发环境要求

### 1.1 软件要求

| 软件    | 最低版本 | 推荐版本 | 说明                |
| :------ | :------- | :------- | :------------------ |
| Node.js | 18.0     | 20.x LTS | 前端运行时          |
| Python  | 3.10     | 3.11     | 后端运行时          |
| pnpm    | 8.0      | 最新     | 包管理器（可选npm） |
| Git     | 2.30     | 最新     | 版本控制            |
| VS Code | -        | 最新     | 推荐IDE             |

### 1.2 推荐VS Code扩展

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "redhat.vscode-yaml",
    "yzhang.markdown-all-in-one"
  ]
}
```

---

## 2. 项目初始化

### 2.1 克隆仓库

```bash
git clone https://github.com/ilovend/md2docx.git
cd md2docx
```

### 2.2 前端环境配置

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install
# 或使用pnpm
pnpm install

# 验证安装
npm run dev
```

访问 http://localhost:5173 确认前端正常运行。

### 2.3 后端环境配置

```bash
# 回到项目根目录
cd ..

# 创建Python虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
# 或使用开发依赖
pip install -r requirements-dev.txt

# 验证安装
python main.py
```

访问 http://localhost:8000/docs 确认后端API文档可访问。

### 2.4 环境变量配置

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务配置
HOST=127.0.0.1
PORT=8000
DEBUG=true

# 文件存储
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
RULES_DIR=./rules

# 处理限制
MAX_FILE_SIZE_MB=50
MAX_BATCH_SIZE=20
```

---

## 3. 开发工作流

### 3.1 同时启动前后端

**终端1 - 后端服务**：

```bash
# 激活虚拟环境
.\venv\Scripts\activate

# 启动开发服务器（支持热重载）
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**终端2 - 前端服务**：

```bash
cd frontend
npm run dev
```

### 3.2 代码风格

**Python代码**：

```bash
# 格式化
black .

# Linting
ruff check .

# 类型检查
mypy .
```

**TypeScript/React代码**：

```bash
cd frontend

# 格式化
npx prettier --write .

# Linting
npx eslint .
```

### 3.3 Git提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

| 类型       | 说明      | 示例                         |
| :--------- | :-------- | :--------------------------- |
| `feat`     | 新功能    | `feat: 添加表格边框修复规则` |
| `fix`      | 修复Bug   | `fix: 修复公式编号错位问题`  |
| `docs`     | 文档更新  | `docs: 更新API接口文档`      |
| `style`    | 代码风格  | `style: 格式化Python代码`    |
| `refactor` | 重构      | `refactor: 优化规则匹配逻辑` |
| `test`     | 测试相关  | `test: 添加表格规则单元测试` |
| `chore`    | 构建/工具 | `chore: 更新依赖版本`        |

---

## 4. 调试技巧

### 4.1 后端调试

**VS Code launch.json**：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI Debug",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["main:app", "--reload", "--port", "8000"],
      "jinja": true,
      "justMyCode": false
    }
  ]
}
```

**打印调试**：

```python
from utils.logger import logger

logger.debug(f"处理文档: {document_id}")
logger.info(f"匹配到 {len(rules)} 条规则")
logger.warning(f"规则 {rule_id} 执行超时")
logger.error(f"处理失败: {error}", exc_info=True)
```

### 4.2 前端调试

**React DevTools**：

- 安装浏览器扩展
- 查看组件树和状态

**网络请求调试**：

```typescript
// 添加请求拦截器
api.interceptors.request.use((config) => {
  console.log("Request:", config.method, config.url, config.data);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log("Response:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("Error:", error.response?.status, error.response?.data);
    throw error;
  },
);
```

### 4.3 API调试

使用FastAPI内置的Swagger UI：http://localhost:8000/docs

或使用curl/httpie：

```bash
# 上传文件
curl -X POST "http://localhost:8000/api/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.md"

# 处理文档
curl -X POST "http://localhost:8000/api/process" \
  -H "Content-Type: application/json" \
  -d '{"document_id": "doc_abc123", "preset": "corporate"}'
```

---

## 5. 测试

### 5.1 后端测试

```bash
# 运行所有测试
pytest

# 运行特定测试文件
pytest tests/test_engine.py

# 运行带覆盖率
pytest --cov=backend --cov-report=html

# 查看覆盖率报告
open htmlcov/index.html
```

**测试文件结构**：

```
tests/
├── conftest.py           # pytest配置和fixtures
├── test_api.py           # API接口测试
├── test_engine.py        # 规则引擎测试
├── test_document.py      # 文档处理测试
└── fixtures/             # 测试用文档
    ├── sample.md
    ├── sample.docx
    └── expected/
```

**编写测试示例**：

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_upload_markdown():
    """测试Markdown文件上传"""
    with open("tests/fixtures/sample.md", "rb") as f:
        response = client.post(
            "/api/upload",
            files={"file": ("sample.md", f, "text/markdown")}
        )

    assert response.status_code == 200
    assert "document_id" in response.json()

def test_upload_invalid_type():
    """测试上传不支持的文件类型"""
    response = client.post(
        "/api/upload",
        files={"file": ("test.exe", b"content", "application/octet-stream")}
    )

    assert response.status_code == 400
    assert response.json()["error"] == "invalid_file_type"
```

### 5.2 前端测试

```bash
cd frontend

# 运行测试（如果配置了vitest）
npm run test

# 运行测试并监视变更
npm run test:watch
```

---

## 6. 构建和打包

### 6.1 前端构建

```bash
cd frontend

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

输出目录：`dist/`

### 6.2 后端打包

使用PyInstaller打包Python后端：

```bash
# 安装PyInstaller
pip install pyinstaller

# 打包
pyinstaller --onefile --name md2docx-backend main.py

# 输出在 dist/md2docx-backend.exe
```

### 6.3 Electron打包（未来）

```bash
# 安装electron-builder
npm install electron-builder --save-dev

# 打包
npm run electron:build
```

---

## 7. 项目结构说明

```
md2docx/
├── frontend/                # Vite + React + TypeScript 前端项目
│   ├── src/
│   │   ├── components/      # UI 组件和业务组件
│   │   ├── pages/           # 页面组件
│   │   ├── stores/          # Zustand 状态
│   │   ├── services/        # API 服务
│   │   └── layouts/         # 布局组件
│   ├── dist/                # 构建输出
│   └── package.json
│
├── backend/                 # [待创建] Python后端
│   ├── api/                 # API层
│   ├── core/                # 核心业务
│   ├── engine/              # 规则引擎
│   └── main.py              # 入口
│
├── electron/                # [待创建] Electron主进程
│
├── docs/                    # 文档
│   ├── adr/                 # 架构决策记录
│   └── *.md                 # 各类文档
│
├── presets/                 # [待创建] 预设配置
├── rules/                   # [待创建] 规则文件
├── tests/                   # [待创建] 测试代码
│
├── .env                     # 环境变量（不提交）
├── .env.example             # 环境变量模板
├── .gitignore               # Git忽略规则
├── main.py                  # 当前后端入口
├── requirements.txt         # Python依赖
└── README.md                # 项目主页
```

---

## 8. 常见问题

### Q: 前端启动报错 `ENOENT: no such file or directory`

确保已安装依赖：

```bash
cd frontend
npm install
```

### Q: 后端启动报错 `ModuleNotFoundError`

确保虚拟环境已激活且已安装依赖：

```bash
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Q: CORS错误

检查后端CORS配置是否允许前端域名：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite默认端口
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Q: 文件上传失败

检查文件大小限制和目录权限：

```python
# 增加文件大小限制
app = FastAPI(max_request_size=50 * 1024 * 1024)  # 50MB
```

---

## 9. 贡献流程

1. Fork仓库到个人账户
2. 创建功能分支：`git checkout -b feature/new-rule`
3. 编写代码和测试
4. 提交变更：`git commit -m "feat: 添加新规则"`
5. 推送分支：`git push origin feature/new-rule`
6. 创建Pull Request

详见 [CONTRIBUTING.md](../CONTRIBUTING.md)
