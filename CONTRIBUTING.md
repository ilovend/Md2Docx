# 贡献指南

我们非常欢迎您对本项目的贡献！您的每一份努力都对我们至关重要。

## ❓ 如何贡献

我们欢迎各种形式的贡献，包括但不限于：
*   报告 Bug
*   提出新功能建议
*   编写或改进文档
*   提交代码修复或新功能

## 🐞 报告 Bug

*   请先在 [Issues](https://github.com/ilovend/md2docx/issues) 页面搜索，确保您的问题尚未被报告。
*   如果问题是新的，请创建一个新的 Issue，并使用 "Bug Report" 模板。请尽可能详细地描述问题，包括复现步骤、期望行为和实际行为。

## ✨ 功能建议

*   如果您有新功能的想法，请创建一个新的 Issue，并使用 "Feature Request" 模板。请详细描述您希望实现的功能以及它的使用场景。

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

*   **代码风格**: 请遵循项目现有的代码风格。我们使用 [Black](https://github.com/psf/black) 进行代码格式化，使用 [Ruff](https://github.com/astral-sh/ruff) 进行 Linting。
*   **测试**: 对于任何代码更改，请确保相关的测试用例都能够通过。如果添加新功能，请附上相应的测试。

感谢您的贡献！
