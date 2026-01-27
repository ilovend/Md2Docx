import sys
import subprocess
import re
from pathlib import Path

# ----------------------------------------------------------------------------
# Constants & Config
# ----------------------------------------------------------------------------
RED = "\033[0;31m"
GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
NC = "\033[0m"

ERRORS = 0
WARNINGS = 0


def log_error(msg):
    global ERRORS
    print(f"  {RED}✗{NC} {msg}")
    ERRORS += 1


def log_success(msg):
    print(f"  {GREEN}✓{NC} {msg}")


def log_warning(msg):
    global WARNINGS
    print(f"  {YELLOW}⚠{NC} {msg}")
    WARNINGS += 1


# ----------------------------------------------------------------------------
# 1. Markdown Check
# ----------------------------------------------------------------------------
def check_markdown_links():
    print(f"{YELLOW}[1/6] 检查文档链接...{NC}")
    docs_dir = Path("docs")
    if not docs_dir.exists():
        log_warning("docs 目录不存在")
        return

    md_files = list(docs_dir.rglob("*.md"))
    local_errors = 0

    for md_file in md_files:
        if "template" in md_file.name.lower():
            continue

        content = md_file.read_text(encoding="utf-8")
        # Match [text](path.md)
        links = re.findall(r"\[.*?\]\((\.\.?/[^)]+\.md)\)", content)

        for link in links:
            target_path = (md_file.parent / link).resolve()
            if not target_path.exists():
                log_error(f"{md_file}: 死链 -> {link}")
                local_errors += 1

    if local_errors == 0:
        log_success("文档链接检查通过")


# ----------------------------------------------------------------------------
# 2. ADR Check
# ----------------------------------------------------------------------------
def check_adr_numbering():
    print(f"\n{YELLOW}[2/6] 检查 ADR 编号...{NC}")
    adr_dir = Path("docs/decisions/adr")
    if not adr_dir.exists():
        log_warning("ADR 目录不存在")
        return

    numbers = []
    for f in adr_dir.glob("*.md"):
        match = re.match(r"^([0-9]+)", f.name)
        if match:
            numbers.append(match.group(1))

    duplicates = set([x for x in numbers if numbers.count(x) > 1])
    if duplicates:
        log_error(f"发现重复的 ADR 编号: {', '.join(duplicates)}")
    else:
        log_success("ADR 编号无重复")


# ----------------------------------------------------------------------------
# 3. Prompt Template Check
# ----------------------------------------------------------------------------
def check_prompt_templates():
    print(f"\n{YELLOW}[3/6] 检查 Prompt 模板字段...{NC}")
    prompt_dir = Path("docs/prompts")
    if not prompt_dir.exists():
        log_warning("Prompt 目录不存在")
        return

    local_errors = 0
    for f in prompt_dir.glob("*.md"):
        if "template" in f.name.lower():
            continue

        content = f.read_text(encoding="utf-8")
        if "## 目标" not in content:
            log_error(f"{f.name}: 缺少 '## 目标' 字段")
            local_errors += 1
        if "## 验收标准" not in content:
            log_error(f"{f.name}: 缺少 '## 验收标准' 字段")
            local_errors += 1

    if local_errors == 0:
        log_success("Prompt 模板字段检查通过")


# ----------------------------------------------------------------------------
# 4. Python Syntax Check
# ----------------------------------------------------------------------------
def check_python_syntax():
    print(f"\n{YELLOW}[4/6] 检查 Python 语法...{NC}")
    root = Path(".")
    py_files = [
        f
        for f in root.rglob("*.py")
        if ".venv" not in f.parts and "node_modules" not in f.parts
    ]

    if not py_files:
        log_warning("未找到 Python 文件")
        return

    local_errors = 0
    for f in py_files:
        try:
            subprocess.run(
                [sys.executable, "-m", "py_compile", str(f)],
                check=True,
                capture_output=True,
            )
        except subprocess.CalledProcessError:
            log_error(f"{f}: 语法错误")
            local_errors += 1

    if local_errors == 0:
        log_success("Python 语法检查通过")


# ----------------------------------------------------------------------------
# 5. Formatting Check
# ----------------------------------------------------------------------------
def check_formatting():
    print(f"\n{YELLOW}[5/6] 检查代码格式...{NC}")

    # Python Black
    try:
        subprocess.run(
            ["black", "--check", "--quiet", "."], check=True, capture_output=True
        )
        log_success("Python 代码格式正确")
    except FileNotFoundError:
        log_warning("Black 未安装，跳过检查")
    except subprocess.CalledProcessError:
        log_warning("Python 代码格式不符合 Black 规范")

    # Frontend Prettier
    frontend_dir = Path("frontend")
    if frontend_dir.exists() and (frontend_dir / "package.json").exists():
        try:
            # Use npx on windows might need shell=True or full path
            cmd = ["npx", "prettier", "--check", "src/**/*.{ts,tsx}"]
            subprocess.run(
                cmd, cwd="frontend", check=True, capture_output=True, shell=True
            )
            log_success("前端代码格式正确")
        except subprocess.CalledProcessError:
            log_warning("前端代码格式不符合 Prettier 规范")
        except Exception as e:
            log_warning(f"Prettier 检查失败: {e}")


# ----------------------------------------------------------------------------
# 6. Documentation Index Integrity
# ----------------------------------------------------------------------------
def check_index_integrity():
    print(f"\n{YELLOW}[6/6] 检查文档索引完整性...{NC}")
    index_file = Path("docs/index.md")
    if not index_file.exists():
        log_error("docs/index.md 不存在")
        return

    content = index_file.read_text(encoding="utf-8")
    required = ["需求文档", "设计文档", "架构决策记录", "提示词库"]
    local_errors = 0
    for section in required:
        if section not in content:
            log_error(f"缺少章节: {section}")
            local_errors += 1

    if local_errors == 0:
        log_success("文档索引完整性检查通过")


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
def main():
    print("========================================")
    print("  Md2Docx 验证脚本 (Python版)")
    print("========================================\n")

    check_markdown_links()
    check_adr_numbering()
    check_prompt_templates()
    check_python_syntax()
    check_formatting()
    check_index_integrity()

    print("\n========================================")
    print("  验证结果")
    print("========================================")

    if ERRORS > 0:
        print(f"  {RED}错误: {ERRORS}{NC}")
    if WARNINGS > 0:
        print(f"  {YELLOW}警告: {WARNINGS}{NC}")

    if ERRORS == 0:
        if WARNINGS == 0:
            print(f"  {GREEN}✓ 所有检查通过！{NC}")
        else:
            print(f"  {YELLOW}⚠ 验证通过，但有警告{NC}")
        sys.exit(0)
    else:
        print(f"  {RED}✗ 验证失败{NC}")
        sys.exit(1)


if __name__ == "__main__":
    main()
