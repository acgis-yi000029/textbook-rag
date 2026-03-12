#!/usr/bin/env python3
"""
Feature Scaffolder

根据模板生成新功能的代码结构。

Usage:
    python .agent/scripts/scaffold.py feature --name documents
    python .agent/scripts/scaffold.py feature --name documents --type backend
    python .agent/scripts/scaffold.py feature --name documents --type frontend
    python .agent/scripts/scaffold.py feature --name documents --type full
"""

import argparse
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent.parent
TEMPLATES_DIR = PROJECT_ROOT / ".agent" / "templates"


def to_pascal_case(name: str) -> str:
    """Convert snake_case to PascalCase"""
    return "".join(word.capitalize() for word in name.split("_"))


def to_snake_case(name: str) -> str:
    """Convert PascalCase to snake_case"""
    s1 = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


def get_variables(feature_name: str) -> Dict[str, str]:
    """Generate template variables from feature name"""
    snake_name = to_snake_case(feature_name)
    return {
        "{{feature_name}}": snake_name,
        "{{FeatureName}}": to_pascal_case(snake_name),
        "{{feature_name_plural}}": f"{snake_name}s",
        "{{author}}": "Claude",
        "{{date}}": datetime.now().strftime("%Y-%m-%d"),
    }


def render_template(template_path: Path, variables: Dict[str, str]) -> str:
    """Render a template with variable substitution"""
    content = template_path.read_text(encoding="utf-8")
    for key, value in variables.items():
        content = content.replace(key, value)
    return content


def create_file(path: Path, content: str, dry_run: bool = False) -> None:
    """Create a file with content"""
    if dry_run:
        print(f"  [DRY RUN] Would create: {path}")
        return

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  ✅ Created: {path}")


def scaffold_backend(feature_name: str, variables: Dict[str, str], dry_run: bool = False) -> None:
    """Generate backend feature structure"""
    print("\n📦 Scaffolding Backend...")

    snake_name = variables["{{feature_name}}"]
    backend_dir = PROJECT_ROOT / "backend" / "app" / snake_name

    # Routes
    routes_template = TEMPLATES_DIR / "backend" / "routes.py.template"
    if routes_template.exists():
        content = render_template(routes_template, variables)
        create_file(backend_dir / "routes.py", content, dry_run)

    # Service
    service_template = TEMPLATES_DIR / "backend" / "service.py.template"
    if service_template.exists():
        content = render_template(service_template, variables)
        create_file(backend_dir / "service.py", content, dry_run)

    # Schemas
    schemas_template = TEMPLATES_DIR / "backend" / "schemas.py.template"
    if schemas_template.exists():
        content = render_template(schemas_template, variables)
        create_file(backend_dir / "schemas.py", content, dry_run)

    # __init__.py
    init_content = f'"""{variables["{{FeatureName}}"]} Module"""\n'
    create_file(backend_dir / "__init__.py", init_content, dry_run)

    # Tests
    test_template = TEMPLATES_DIR / "tests" / "test_routes.py.template"
    if test_template.exists():
        content = render_template(test_template, variables)
        test_dir = PROJECT_ROOT / "backend" / "tests" / snake_name
        create_file(test_dir / "test_routes.py", content, dry_run)
        create_file(test_dir / "__init__.py", "", dry_run)


def scaffold_frontend(feature_name: str, variables: Dict[str, str], dry_run: bool = False) -> None:
    """Generate frontend feature structure"""
    print("\n🎨 Scaffolding Frontend...")

    snake_name = variables["{{feature_name}}"]
    pascal_name = variables["{{FeatureName}}"]
    feature_dir = PROJECT_ROOT / "frontend" / "src" / "features" / snake_name

    # Component
    component_template = TEMPLATES_DIR / "frontend" / "component.tsx.template"
    if component_template.exists():
        content = render_template(component_template, variables)
        create_file(feature_dir / "components" / f"{pascal_name}.tsx", content, dry_run)

    # Hook
    hook_template = TEMPLATES_DIR / "frontend" / "hook.ts.template"
    if hook_template.exists():
        content = render_template(hook_template, variables)
        create_file(feature_dir / "hooks" / f"use{pascal_name}.ts", content, dry_run)

    # Service
    service_template = TEMPLATES_DIR / "frontend" / "service.ts.template"
    if service_template.exists():
        content = render_template(service_template, variables)
        create_file(feature_dir / "services" / f"{snake_name}Api.ts", content, dry_run)

    # Types
    types_content = f"""/**
 * {pascal_name} Types
 */

export interface {pascal_name}Data {{
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}}

export interface {pascal_name}CreateRequest {{
  name: string;
  description?: string;
}}

export interface {pascal_name}UpdateRequest {{
  name?: string;
  description?: string;
}}

export interface {pascal_name}ListResponse {{
  items: {pascal_name}Data[];
  total: number;
  skip: number;
  limit: number;
}}
"""
    create_file(feature_dir / "types.ts", types_content, dry_run)

    # Index
    index_content = f"""export * from './components/{pascal_name}';
export * from './hooks/use{pascal_name}';
export * from './services/{snake_name}Api';
export * from './types';
"""
    create_file(feature_dir / "index.ts", index_content, dry_run)

    # Component test
    test_template = TEMPLATES_DIR / "tests" / "component.test.tsx.template"
    if test_template.exists():
        content = render_template(test_template, variables)
        create_file(feature_dir / "components" / f"{pascal_name}.test.tsx", content, dry_run)


def scaffold_docs(feature_name: str, variables: Dict[str, str], dry_run: bool = False) -> None:
    """Generate documentation"""
    print("\n📝 Scaffolding Docs...")

    snake_name = variables["{{feature_name}}"]
    pascal_name = variables["{{FeatureName}}"]

    plan_content = f"""# {pascal_name} Implementation Plan

## Overview
[Brief description of the feature]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2

## Technical Design

### Backend
- Routes: `backend/app/{snake_name}/routes.py`
- Service: `backend/app/{snake_name}/service.py`
- Schemas: `backend/app/{snake_name}/schemas.py`

### Frontend
- Component: `frontend/src/features/{snake_name}/`
- API Service: `frontend/src/features/{snake_name}/services/`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/{snake_name}` | List all |
| GET | `/api/v1/{snake_name}/{{id}}` | Get by ID |
| POST | `/api/v1/{snake_name}` | Create |
| PUT | `/api/v1/{snake_name}/{{id}}` | Update |
| DELETE | `/api/v1/{snake_name}/{{id}}` | Delete |

## Test Plan
- [ ] Unit tests for service layer
- [ ] API endpoint tests
- [ ] Frontend component tests

## Status
- Created: {variables["{{date}}"]}
- Status: Draft
"""
    create_file(PROJECT_ROOT / "docs" / "plans" / f"{snake_name}-plan.md", plan_content, dry_run)


def main():
    parser = argparse.ArgumentParser(description="Feature Scaffolder")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Feature command
    feature_parser = subparsers.add_parser("feature", help="Generate a new feature")
    feature_parser.add_argument("--name", "-n", required=True, help="Feature name (snake_case)")
    feature_parser.add_argument(
        "--type", "-t",
        choices=["backend", "frontend", "full"],
        default="full",
        help="Type of scaffolding"
    )
    feature_parser.add_argument("--dry-run", action="store_true", help="Preview without creating files")

    args = parser.parse_args()

    if args.command == "feature":
        variables = get_variables(args.name)

        print(f"\n🚀 Scaffolding feature: {args.name}")
        print(f"   Variables: {variables}")

        if args.type in ["backend", "full"]:
            scaffold_backend(args.name, variables, args.dry_run)

        if args.type in ["frontend", "full"]:
            scaffold_frontend(args.name, variables, args.dry_run)

        if args.type == "full":
            scaffold_docs(args.name, variables, args.dry_run)

        print("\n✅ Scaffolding complete!")

        if not args.dry_run:
            print("\n📋 Next steps:")
            print(f"   1. Review generated files")
            print(f"   2. Implement TODO items in service.py")
            print(f"   3. Add routes to main.py")
            print(f"   4. Run tests: uv run pytest backend/tests/{args.name}/")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
