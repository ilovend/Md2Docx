#!/bin/bash
# ============================================================================
# Md2Docx 验证脚本
# 用途：统一执行格式化检查、语法检查、文档链接检查等
# 使用：./scripts/verify.sh
# ============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
ERRORS=0
WARNINGS=0

echo "========================================"
echo "  Md2Docx 验证脚本"
echo "========================================"
echo ""

# ----------------------------------------------------------------------------
# 1. 文档链接检查
# ----------------------------------------------------------------------------
echo -e "${YELLOW}[1/6] 检查文档链接...${NC}"

check_markdown_links() {
    local file=$1
    local errors=0
    
    # 提取 markdown 链接并检查
    grep -oE '\[.*?\]\((\.\.?/[^)]+\.md)\)' "$file" 2>/dev/null | while read -r link; do
        # 提取路径
        path=$(echo "$link" | grep -oE '\((\.\.?/[^)]+\.md)\)' | tr -d '()')
        dir=$(dirname "$file")
        full_path="$dir/$path"
        
        if [ ! -f "$full_path" ]; then
            echo -e "  ${RED}✗${NC} $file: 死链 -> $path"
            ((errors++)) || true
        fi
    done
    
    return $errors
}

# 检查 docs 目录下的所有 md 文件
find docs -name "*.md" -type f | while read -r file; do
    check_markdown_links "$file" || ((ERRORS++)) || true
done

if [ $ERRORS -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} 文档链接检查通过"
else
    echo -e "  ${RED}✗${NC} 发现 $ERRORS 个死链"
fi

# ----------------------------------------------------------------------------
# 2. ADR 编号检查
# ----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[2/6] 检查 ADR 编号...${NC}"

ADR_DIR="docs/decisions/adr"
if [ -d "$ADR_DIR" ]; then
    # 检查编号重复
    duplicates=$(ls "$ADR_DIR"/*.md 2>/dev/null | xargs -I{} basename {} | grep -oE '^[0-9]+' | sort | uniq -d)
    
    if [ -n "$duplicates" ]; then
        echo -e "  ${RED}✗${NC} 发现重复的 ADR 编号: $duplicates"
        ((ERRORS++))
    else
        echo -e "  ${GREEN}✓${NC} ADR 编号无重复"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} ADR 目录不存在"
fi

# ----------------------------------------------------------------------------
# 3. Prompt 模板字段检查
# ----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[3/6] 检查 Prompt 模板字段...${NC}"

PROMPT_DIR="docs/prompts"
if [ -d "$PROMPT_DIR" ]; then
    for file in "$PROMPT_DIR"/*.md; do
        [ -f "$file" ] || continue
        # 跳过模板文件
        [[ "$file" == *"template"* ]] && continue
        
        # 检查必要字段
        if ! grep -q "## 目标" "$file"; then
            echo -e "  ${RED}✗${NC} $file: 缺少 '## 目标' 字段"
            ((ERRORS++))
        fi
        if ! grep -q "## 验收标准" "$file"; then
            echo -e "  ${RED}✗${NC} $file: 缺少 '## 验收标准' 字段"
            ((ERRORS++))
        fi
    done
    
    if [ $ERRORS -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} Prompt 模板字段检查通过"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} Prompt 目录不存在"
fi

# ----------------------------------------------------------------------------
# 4. Python 语法检查 (如果有 Python 文件)
# ----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[4/6] 检查 Python 语法...${NC}"

if command -v python &> /dev/null; then
    python_files=$(find . -name "*.py" -not -path "./.venv/*" -not -path "./node_modules/*" 2>/dev/null)
    
    if [ -n "$python_files" ]; then
        for file in $python_files; do
            if ! python -m py_compile "$file" 2>/dev/null; then
                echo -e "  ${RED}✗${NC} $file: 语法错误"
                ((ERRORS++))
            fi
        done
        
        if [ $ERRORS -eq 0 ]; then
            echo -e "  ${GREEN}✓${NC} Python 语法检查通过"
        fi
    else
        echo -e "  ${YELLOW}⚠${NC} 未找到 Python 文件"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} Python 未安装，跳过检查"
fi

# ----------------------------------------------------------------------------
# 5. 格式化检查
# ----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[5/6] 检查代码格式...${NC}"

# 检查 Python 格式 (如果安装了 black)
if command -v black &> /dev/null; then
    python_files=$(find . -name "*.py" -not -path "./.venv/*" -not -path "./node_modules/*" 2>/dev/null)
    if [ -n "$python_files" ]; then
        if ! black --check --quiet $python_files 2>/dev/null; then
            echo -e "  ${YELLOW}⚠${NC} Python 代码格式不符合 Black 规范"
            echo "  运行 'black .' 进行格式化"
            ((WARNINGS++))
        else
            echo -e "  ${GREEN}✓${NC} Python 代码格式正确"
        fi
    fi
else
    echo -e "  ${YELLOW}⚠${NC} Black 未安装，跳过 Python 格式检查"
fi

# 检查前端格式 (如果安装了 prettier)
if command -v npx &> /dev/null && [ -f "Access Project Link/package.json" ]; then
    cd "Access Project Link"
    if npx prettier --check "src/**/*.{ts,tsx}" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} 前端代码格式正确"
    else
        echo -e "  ${YELLOW}⚠${NC} 前端代码格式不符合 Prettier 规范"
        ((WARNINGS++))
    fi
    cd ..
fi

# ----------------------------------------------------------------------------
# 6. docs/index.md 完整性检查
# ----------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[6/6] 检查文档索引完整性...${NC}"

INDEX_FILE="docs/index.md"
if [ -f "$INDEX_FILE" ]; then
    # 检查必要章节
    required_sections=("需求文档" "设计文档" "架构决策记录" "提示词库")
    
    for section in "${required_sections[@]}"; do
        if ! grep -q "$section" "$INDEX_FILE"; then
            echo -e "  ${RED}✗${NC} 缺少章节: $section"
            ((ERRORS++))
        fi
    done
    
    if [ $ERRORS -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} 文档索引完整性检查通过"
    fi
else
    echo -e "  ${RED}✗${NC} docs/index.md 不存在"
    ((ERRORS++))
fi

# ----------------------------------------------------------------------------
# 总结
# ----------------------------------------------------------------------------
echo ""
echo "========================================"
echo "  验证结果"
echo "========================================"

if [ $ERRORS -gt 0 ]; then
    echo -e "  ${RED}错误: $ERRORS${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "  ${YELLOW}警告: $WARNINGS${NC}"
fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "  ${GREEN}✓ 所有检查通过！${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "  ${YELLOW}⚠ 验证通过，但有警告${NC}"
    exit 0
else
    echo -e "  ${RED}✗ 验证失败${NC}"
    exit 1
fi
