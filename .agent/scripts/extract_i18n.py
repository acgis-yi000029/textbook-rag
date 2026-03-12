#!/usr/bin/env python3
"""
i18n Key Extractor

从前端代码中提取 i18n 翻译键，生成待翻译列表。

Usage:
    python .agent/scripts/extract_i18n.py
    python .agent/scripts/extract_i18n.py --output missing_keys.json
    python .agent/scripts/extract_i18n.py --check  # 检查缺失的翻译
"""

import argparse
import json
import re
from pathlib import Path
from typing import Dict, Set, List

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent.parent
FRONTEND_SRC = PROJECT_ROOT / "frontend" / "src"
LOCALES_DIR = FRONTEND_SRC / "locales"

# 匹配 t('key') 或 t("key") 的正则
T_FUNCTION_PATTERN = re.compile(r"""t\(['"]([^'"]+)['"]\)""")

# 匹配 useTranslation('namespace') 的正则
NAMESPACE_PATTERN = re.compile(r"""useTranslation\(['"]([^'"]+)['"]\)""")


def extract_keys_from_file(file_path: Path) -> Set[str]:
    """从单个文件中提取 i18n 键"""
    keys = set()
    content = file_path.read_text(encoding="utf-8")

    # 提取所有 t() 调用中的键
    for match in T_FUNCTION_PATTERN.finditer(content):
        keys.add(match.group(1))

    return keys


def extract_all_keys(src_dir: Path) -> Dict[str, Set[str]]:
    """从所有源文件中提取 i18n 键"""
    keys_by_file = {}

    # 遍历所有 TypeScript/TSX 文件
    for file_path in src_dir.rglob("*.tsx"):
        keys = extract_keys_from_file(file_path)
        if keys:
            relative_path = file_path.relative_to(src_dir)
            keys_by_file[str(relative_path)] = keys

    for file_path in src_dir.rglob("*.ts"):
        if not file_path.name.endswith(".d.ts"):
            keys = extract_keys_from_file(file_path)
            if keys:
                relative_path = file_path.relative_to(src_dir)
                keys_by_file[str(relative_path)] = keys

    return keys_by_file


def load_existing_translations(locales_dir: Path) -> Dict[str, Dict]:
    """加载现有的翻译文件"""
    translations = {}

    for lang_dir in locales_dir.iterdir():
        if lang_dir.is_dir():
            lang = lang_dir.name
            translations[lang] = {}

            for json_file in lang_dir.glob("*.json"):
                namespace = json_file.stem
                with open(json_file, "r", encoding="utf-8") as f:
                    translations[lang][namespace] = json.load(f)

    return translations


def flatten_keys(obj: dict, prefix: str = "") -> Set[str]:
    """将嵌套的翻译对象展平为键集合"""
    keys = set()
    for key, value in obj.items():
        full_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            keys.update(flatten_keys(value, full_key))
        else:
            keys.add(full_key)
    return keys


def find_missing_keys(
    used_keys: Set[str],
    existing_keys: Set[str],
) -> Set[str]:
    """找出缺失的翻译键"""
    return used_keys - existing_keys


def main():
    parser = argparse.ArgumentParser(description="i18n Key Extractor")
    parser.add_argument(
        "--output", "-o",
        help="Output file for extracted keys"
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check for missing translations"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed output"
    )

    args = parser.parse_args()

    print("=" * 60)
    print("🌐 i18n Key Extractor")
    print("=" * 60)

    # 提取使用的键
    print("\n📂 Scanning source files...")
    keys_by_file = extract_all_keys(FRONTEND_SRC)

    all_used_keys = set()
    for keys in keys_by_file.values():
        all_used_keys.update(keys)

    print(f"   Found {len(all_used_keys)} unique keys in {len(keys_by_file)} files")

    if args.verbose:
        print("\n📋 Keys by file:")
        for file_path, keys in sorted(keys_by_file.items()):
            print(f"\n   {file_path}:")
            for key in sorted(keys):
                print(f"      - {key}")

    # 加载现有翻译
    if args.check and LOCALES_DIR.exists():
        print("\n📁 Loading existing translations...")
        translations = load_existing_translations(LOCALES_DIR)

        for lang, namespaces in translations.items():
            existing_keys = set()
            for namespace, data in namespaces.items():
                ns_keys = flatten_keys(data)
                existing_keys.update(f"{namespace}.{k}" for k in ns_keys)

            missing = find_missing_keys(all_used_keys, existing_keys)

            if missing:
                print(f"\n⚠️  Missing keys for '{lang}':")
                for key in sorted(missing):
                    print(f"      - {key}")
            else:
                print(f"\n✅ All keys present for '{lang}'")

    # 输出结果
    if args.output:
        output_data = {
            "total_keys": len(all_used_keys),
            "files_scanned": len(keys_by_file),
            "keys": sorted(all_used_keys),
            "keys_by_file": {k: sorted(v) for k, v in keys_by_file.items()},
        }

        output_path = Path(args.output)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Results saved to: {output_path}")

    print("\n" + "=" * 60)
    print(f"📊 Summary: {len(all_used_keys)} keys found")
    print("=" * 60)


if __name__ == "__main__":
    main()
