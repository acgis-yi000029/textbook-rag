#!/usr/bin/env python3
"""
Batch validation script - validates ALL skills in a directory
Based on official skill-creator's quick_validate.py with extended checks

Usage: python batch_validate.py <skills_directory> [--fix]
"""

import sys
import os
import re
import json
import yaml
from pathlib import Path
from datetime import datetime


def count_lines(filepath):
    """Count lines in a file"""
    try:
        return len(filepath.read_text(encoding='utf-8').splitlines())
    except:
        return 0


def estimate_tokens(text):
    """Rough token estimate (words * 1.3)"""
    return int(len(text.split()) * 1.3)


def validate_skill_extended(skill_path):
    """Extended validation of a skill directory"""
    skill_path = Path(skill_path)
    issues = []
    warnings = []
    info = {}

    # ── 1. Check SKILL.md exists ──
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return {"status": "FAIL", "issues": ["SKILL.md not found"], "warnings": [], "info": {}}

    content = skill_md.read_text(encoding='utf-8')
    lines = content.splitlines()
    info["skill_md_lines"] = len(lines)
    info["skill_md_tokens"] = estimate_tokens(content)

    # ── 2. Frontmatter validation ──
    if not content.startswith('---'):
        issues.append("No YAML frontmatter found")
        return {"status": "FAIL", "issues": issues, "warnings": warnings, "info": info}

    # Handle both \r\n and \n line endings
    match = re.match(r'^---\r?\n(.*?)\r?\n---', content, re.DOTALL)
    if not match:
        issues.append("Invalid frontmatter format (unclosed ---)")
        return {"status": "FAIL", "issues": issues, "warnings": warnings, "info": info}

    frontmatter_text = match.group(1)
    try:
        frontmatter = yaml.safe_load(frontmatter_text)
        if not isinstance(frontmatter, dict):
            issues.append("Frontmatter must be a YAML dictionary")
            return {"status": "FAIL", "issues": issues, "warnings": warnings, "info": info}
    except yaml.YAMLError as e:
        issues.append(f"Invalid YAML in frontmatter: {e}")
        return {"status": "FAIL", "issues": issues, "warnings": warnings, "info": info}

    # ── 3. Required fields ──
    ALLOWED_PROPERTIES = {'name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'}
    unexpected_keys = set(frontmatter.keys()) - ALLOWED_PROPERTIES
    if unexpected_keys:
        warnings.append(f"Unexpected frontmatter keys: {', '.join(sorted(unexpected_keys))}")

    name = frontmatter.get('name', '')
    description = frontmatter.get('description', '')
    info["name"] = name
    info["description_length"] = len(str(description)) if description else 0

    if not name:
        issues.append("Missing 'name' in frontmatter")
    elif not isinstance(name, str):
        issues.append(f"Name must be a string, got {type(name).__name__}")
    else:
        name = name.strip()
        if not re.match(r'^[a-z0-9-]+$', name):
            issues.append(f"Name '{name}' should be kebab-case (lowercase, digits, hyphens only)")
        if name.startswith('-') or name.endswith('-') or '--' in name:
            issues.append(f"Name '{name}' cannot start/end with hyphen or contain consecutive hyphens")
        if len(name) > 64:
            issues.append(f"Name too long ({len(name)} chars, max 64)")
        # Check if name matches directory name
        dir_name = skill_path.name
        if name != dir_name:
            warnings.append(f"Name '{name}' doesn't match directory '{dir_name}'")

    if not description:
        issues.append("Missing 'description' in frontmatter")
    elif not isinstance(description, str):
        issues.append(f"Description must be a string, got {type(description).__name__}")
    else:
        description = description.strip()
        if '<' in description or '>' in description:
            issues.append("Description contains angle brackets (< or >)")
        if len(description) > 1024:
            issues.append(f"Description too long ({len(description)} chars, max 1024)")
        if len(description) < 20:
            warnings.append(f"Description very short ({len(description)} chars) - may not trigger well")

    # ── 4. Body content checks ──
    if len(lines) > 500:
        warnings.append(f"SKILL.md has {len(lines)} lines (recommended < 500)")
    if info["skill_md_tokens"] > 5000:
        warnings.append(f"SKILL.md estimated at {info['skill_md_tokens']} tokens (recommended < 5000)")

    # Check for unclosed code fences
    fence_count = 0
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('```') or stripped.startswith('~~~'):
            fence_count += 1
    if fence_count % 2 != 0:
        issues.append(f"Unclosed code fence detected ({fence_count} fence markers)")

    # ── 5. Directory structure ──
    RECOGNIZED_DIRS = {'scripts', 'references', 'assets', 'agents', 'evals', 'eval-viewer'}
    RECOGNIZED_ROOT_FILES = {'SKILL.md', 'LICENSE.txt', 'LICENSE', 'README.md'}

    for item in skill_path.iterdir():
        if item.is_dir():
            if item.name not in RECOGNIZED_DIRS and not item.name.startswith('.'):
                warnings.append(f"Non-standard directory: {item.name}/")
        elif item.is_file():
            if item.name not in RECOGNIZED_ROOT_FILES and not item.name.startswith('.'):
                if item.name != 'CHANGELOG.md':
                    warnings.append(f"Non-standard root file: {item.name}")

    # ── 6. References check ──
    refs_dir = skill_path / 'references'
    if refs_dir.exists():
        ref_files = list(refs_dir.rglob('*'))
        ref_files = [f for f in ref_files if f.is_file()]
        info["reference_files"] = len(ref_files)
        total_ref_tokens = 0
        for ref_file in ref_files:
            try:
                ref_content = ref_file.read_text(encoding='utf-8')
                tokens = estimate_tokens(ref_content)
                total_ref_tokens += tokens
                if tokens > 10000:
                    warnings.append(f"Reference file {ref_file.name} is large (~{tokens} tokens)")
            except:
                pass
        info["total_ref_tokens"] = total_ref_tokens
        if total_ref_tokens > 25000:
            warnings.append(f"Total reference tokens: ~{total_ref_tokens} (recommended < 25000)")

    # ── 7. Scripts check ──
    scripts_dir = skill_path / 'scripts'
    if scripts_dir.exists():
        script_files = list(scripts_dir.rglob('*'))
        script_files = [f for f in script_files if f.is_file()]
        info["script_files"] = len(script_files)

    # Determine status
    if issues:
        status = "FAIL"
    elif warnings:
        status = "WARN"
    else:
        status = "PASS"

    return {"status": status, "issues": issues, "warnings": warnings, "info": info}


def main():
    if len(sys.argv) < 2:
        print("Usage: python batch_validate.py <skills_directory>")
        sys.exit(1)

    skills_dir = Path(sys.argv[1])
    if not skills_dir.exists():
        print(f"Directory not found: {skills_dir}")
        sys.exit(1)

    # Find all skill directories (contain SKILL.md)
    skill_dirs = sorted([
        d for d in skills_dir.iterdir()
        if d.is_dir() and (d / 'SKILL.md').exists()
    ])

    print(f"\n{'='*70}")
    print(f"  Skill Batch Validator — {len(skill_dirs)} skills found")
    print(f"  Directory: {skills_dir}")
    print(f"  Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}\n")

    results = {}
    stats = {"PASS": 0, "WARN": 0, "FAIL": 0}

    for skill_dir in skill_dirs:
        result = validate_skill_extended(skill_dir)
        results[skill_dir.name] = result
        stats[result["status"]] += 1

        # Print status line
        icon = {"PASS": "✅", "WARN": "⚠️", "FAIL": "❌"}[result["status"]]
        lines = result["info"].get("skill_md_lines", "?")
        tokens = result["info"].get("skill_md_tokens", "?")
        print(f"  {icon} {skill_dir.name:<45} {result['status']:>4}  ({lines} lines, ~{tokens} tokens)")

        if result["issues"]:
            for issue in result["issues"]:
                print(f"      ❌ {issue}")
        if result["warnings"]:
            for warn in result["warnings"]:
                print(f"      ⚠️  {warn}")

    # Summary
    total = len(skill_dirs)
    print(f"\n{'='*70}")
    print(f"  SUMMARY")
    print(f"{'='*70}")
    print(f"  Total skills:  {total}")
    print(f"  ✅ PASS:       {stats['PASS']:>3}  ({stats['PASS']/total*100:.0f}%)")
    print(f"  ⚠️  WARN:       {stats['WARN']:>3}  ({stats['WARN']/total*100:.0f}%)")
    print(f"  ❌ FAIL:       {stats['FAIL']:>3}  ({stats['FAIL']/total*100:.0f}%)")
    print(f"{'='*70}")

    # Categorized issues
    all_issues = []
    all_warnings = []
    for name, result in results.items():
        for issue in result["issues"]:
            all_issues.append((name, issue))
        for warn in result["warnings"]:
            all_warnings.append((name, warn))

    if all_issues:
        print(f"\n  ── ISSUES (must fix) ──")
        for name, issue in all_issues:
            print(f"    {name}: {issue}")

    if all_warnings:
        print(f"\n  ── WARNINGS (should fix) ──")
        # Group warnings by type
        warning_types = {}
        for name, warn in all_warnings:
            # Extract warning category
            category = warn.split(':')[0] if ':' in warn else warn.split('(')[0].strip()
            warning_types.setdefault(category, []).append((name, warn))

        for category, items in sorted(warning_types.items()):
            print(f"\n    [{category}] ({len(items)} skills)")
            for name, warn in items:
                print(f"      - {name}: {warn}")

    # Save JSON report
    report = {
        "timestamp": datetime.now().isoformat(),
        "directory": str(skills_dir),
        "total_skills": total,
        "stats": stats,
        "results": results
    }
    report_path = skills_dir / "_validation_report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\n  📄 Report saved to: {report_path}")
    print()


if __name__ == "__main__":
    main()
