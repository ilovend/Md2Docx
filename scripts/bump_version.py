#!/usr/bin/env python
"""
版本号统一更新脚本
用法: python scripts/bump_version.py 1.0.3
"""

import json
import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent

# 需要更新版本号的文件
VERSION_FILES = [
    {
        "path": ROOT_DIR / "frontend" / "package.json",
        "type": "json",
        "key": "version",
    },
    {
        "path": ROOT_DIR / "frontend" / "src" / "layouts" / "RootLayout.tsx",
        "type": "regex",
        "pattern": r"v\d+\.\d+\.\d+",
        "replacement": "v{version}",
    },
    {
        "path": ROOT_DIR / "frontend" / "src" / "pages" / "Settings" / "index.tsx",
        "type": "regex",
        "pattern": r"v\d+\.\d+\.\d+",
        "replacement": "v{version}",
    },
    {
        "path": ROOT_DIR / "frontend" / "src" / "pages" / "Workspace" / "index.tsx",
        "type": "regex",
        "pattern": r"v\d+\.\d+\.\d+",
        "replacement": "v{version}",
    },
]


def update_json_version(file_path: Path, key: str, version: str) -> bool:
    """更新 JSON 文件中的版本号"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        old_version = data.get(key, "unknown")
        data[key] = version

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")

        print(f"  ✓ {file_path.name}: {old_version} → {version}")
        return True
    except Exception as e:
        print(f"  ✗ {file_path.name}: {e}")
        return False


def update_regex_version(
    file_path: Path, pattern: str, replacement: str, version: str
) -> bool:
    """使用正则表达式更新文件中的版本号"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        new_replacement = replacement.format(version=version)
        new_content, count = re.subn(pattern, new_replacement, content)

        if count == 0:
            print(f"  - {file_path.name}: 未找到版本号模式")
            return True

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)

        print(f"  ✓ {file_path.name}: 更新了 {count} 处")
        return True
    except Exception as e:
        print(f"  ✗ {file_path.name}: {e}")
        return False


def update_package_lock(version: str) -> bool:
    """更新 package-lock.json 中的版本号"""
    lock_file = ROOT_DIR / "frontend" / "package-lock.json"
    try:
        with open(lock_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 更新根版本
        if "version" in data:
            data["version"] = version

        # 更新 packages[""] 中的版本
        if "packages" in data and "" in data["packages"]:
            data["packages"][""]["version"] = version

        with open(lock_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")

        print(f"  ✓ package-lock.json: 已更新")
        return True
    except Exception as e:
        print(f"  ✗ package-lock.json: {e}")
        return False


def main():
    if len(sys.argv) < 2:
        print("用法: python scripts/bump_version.py <version>")
        print("示例: python scripts/bump_version.py 1.0.3")
        sys.exit(1)

    version = sys.argv[1]

    # 验证版本号格式
    if not re.match(r"^\d+\.\d+\.\d+$", version):
        print(f"错误: 无效的版本号格式 '{version}'")
        print("版本号应为 X.Y.Z 格式 (如 1.0.3)")
        sys.exit(1)

    print(f"\n正在更新版本号到 {version}...\n")

    success = True

    for file_config in VERSION_FILES:
        file_path = file_config["path"]
        if not file_path.exists():
            print(f"  - {file_path.name}: 文件不存在，跳过")
            continue

        if file_config["type"] == "json":
            if not update_json_version(file_path, file_config["key"], version):
                success = False
        elif file_config["type"] == "regex":
            if not update_regex_version(
                file_path,
                file_config["pattern"],
                file_config["replacement"],
                version,
            ):
                success = False

    # 更新 package-lock.json
    if not update_package_lock(version):
        success = False

    if success:
        print(f"\n✅ 版本号已更新到 {version}")
        print("\n下一步:")
        print(f"  git add -A")
        print(f'  git commit -m "chore: bump version to {version}"')
        print(f"  git push origin main")
        print(f'  gh release create v{version} --title "v{version}" --generate-notes')
    else:
        print("\n⚠️ 部分文件更新失败，请检查错误信息")
        sys.exit(1)


if __name__ == "__main__":
    main()
