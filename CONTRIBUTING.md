# 贡献指南

我们非常欢迎您对本项目的贡献！您的每一份努力都对我们至关重要。

## ❓ 如何贡献

我们欢迎各种形式的贡献，包括但不限于：

- 报告 Bug
- 提出新功能建议
- 编写或改进文档
- 提交代码修复或新功能

## 🐞 报告 Bug

- 请先在 [Issues](https://github.com/ilovend/md2docx/issues) 页面搜索，确保您的问题尚未被报告。
- 如果问题是新的，请创建一个新的 Issue，并使用 "Bug Report" 模板。请尽可能详细地描述问题，包括复现步骤、期望行为和实际行为。

## ✨ 功能建议

- 如果您有新功能的想法，请创建一个新的 Issue，并使用 "Feature Request" 模板。请详细描述您希望实现的功能以及它的使用场景。

## 🛠️ 提交代码

### 开发流程

1.  **Fork** 本仓库到您的 GitHub 账户。
2.  将您 Fork 的仓库克隆到本地：
    ```sh
    git clone https://github.com/ilovend/your-fork.git
    ```
3.  创建一个新的分支来进行您的修改：
    ```sh
    git checkout -b feature/your-feature-name
    ```
4.  进行修改，并确保所有测试通过。
5.  提交您的修改：
    ```sh
    git commit -m "feat: 实现了一个新功能"
    ```
    我们推荐使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范来撰写提交信息。
6.  将您的分支推送到您的 Fork 仓库：
    ```sh
    git push origin feature/your-feature-name
    ```
7.  在原始仓库的 Pull Requests 页面，创建一个新的 Pull Request。请详细描述您的修改内容。

### 编码规范

- **代码风格**: 请遵循项目现有的代码风格。我们使用 [Black](https://github.com/psf/black) 进行代码格式化，使用 [Ruff](https://github.com/astral-sh/ruff) 进行 Linting。
- **测试**: 对于任何代码更改，请确保相关的测试用例都能够通过。如果添加新功能，请附上相应的测试。

### 代码质量工具配置 (Code Quality Setup)

本项目使用 `pre-commit` 框架统一管理代码检查。请按以下步骤配置开发环境：

1. **安装 Python 依赖**:

   ```sh
   pip install -r requirements.txt
   pip install pre-commit
   ```

2. **安装前端依赖**:

   ```sh
   cd frontend
   npm install
   cd ..
   ```

3. **启用 Pre-commit 钩子**:
   ```sh
   pre-commit install
   ```

现在，每次 `git commit` 时会自动运行格式化和检查。您也可以随时手动运行验证：

```sh
pre-commit run --all-files
```

### 📚 单一真源文档规则

本项目遵循"单一真源"原则，所有文档必须注册在 [docs/index.md](./docs/index.md) 中。

**提交代码时请确保：**

1. 新增文档必须先在 `docs/index.md` 中添加索引条目
2. 重要变更需关联相应的设计文档或 ADR
3. Pull Request 必须填写关联的文档链接

**文档命名规范：**
| 类型 | 格式 | 示例 |
|:---|:---|:---|
| 需求 | `REQ-XXX-标题.md` | `REQ-001-文件上传.md` |
| 设计 | `DESIGN-XXX-标题.md` | `DESIGN-001-规则引擎.md` |
| ADR | `XXXX-标题.md` | `0001-选择FastAPI.md` |
| 提示词 | `PROMPT-XXXX-标题.md` | `PROMPT-0001-代码生成.md` |

详细协作规则请参阅：[工作协议](./docs/working-agreement.md)

感谢您的贡献！
