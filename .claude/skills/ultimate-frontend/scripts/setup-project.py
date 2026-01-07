#!/usr/bin/env python3
"""
Setup script for initializing frontend projects with templates and themes.

Usage:
    python3 setup-project.py --template <template-name> --theme <theme-name> --output <path>

Examples:
    python3 setup-project.py --template landing-page --theme ocean-depth --output ./my-site
    python3 setup-project.py --template react-dashboard --theme midnight-purple --output ./dashboard
"""

import argparse
import shutil
import os
import sys
from pathlib import Path

TEMPLATES = [
    "landing-page",
    "react-dashboard",
    "portfolio",
    "react-app-shell"
]

THEMES = [
    "ocean-depth",
    "forest-twilight",
    "sunset-blaze",
    "midnight-purple",
    "minimal-mono",
    "pastel-dream",
    "corporate-blue",
    "earthy-terracotta",
    "neon-cyber",
    "vintage-sepia"
]

def setup_project(template, theme, output_path):
    """Initialize a new frontend project with template and theme."""

    # Get skill directory
    skill_dir = Path(__file__).parent.parent
    template_dir = skill_dir / "assets" / "templates" / template

    # Check if template exists
    if not template_dir.exists():
        print(f"❌ Template '{template}' not found.")
        print(f"Available templates: {', '.join(TEMPLATES)}")
        sys.exit(1)

    # Create output directory
    output = Path(output_path)
    if output.exists():
        print(f"❌ Output directory '{output_path}' already exists.")
        sys.exit(1)

    output.mkdir(parents=True, exist_ok=True)

    # Copy template files
    print(f"📦 Copying {template} template...")
    if template_dir.is_dir():
        shutil.copytree(template_dir, output, dirs_exist_ok=True)

    # Apply theme if specified
    if theme:
        print(f"🎨 Applying {theme} theme...")
        apply_theme(output, theme, skill_dir)

    print(f"✅ Project initialized at: {output_path}")
    print(f"\nNext steps:")
    print(f"  cd {output_path}")

    if "react" in template:
        print(f"  npm install")
        print(f"  npm run dev")
    else:
        print(f"  Open index.html in your browser")

def apply_theme(project_path, theme_name, skill_dir):
    """Apply theme colors to the project."""

    # Theme color mappings
    themes = {
        "ocean-depth": {
            "primary": "#0077BE",
            "secondary": "#00A5E0",
            "accent": "#FFB81C",
        },
        "forest-twilight": {
            "primary": "#2D6A4F",
            "secondary": "#52B788",
            "accent": "#F4A261",
        },
        "sunset-blaze": {
            "primary": "#E63946",
            "secondary": "#F77F00",
            "accent": "#FCBF49",
        },
        "midnight-purple": {
            "primary": "#7209B7",
            "secondary": "#B5179E",
            "accent": "#F72585",
        },
        "minimal-mono": {
            "primary": "#000000",
            "secondary": "#333333",
            "accent": "#FF6B6B",
        },
        "pastel-dream": {
            "primary": "#A8DADC",
            "secondary": "#F1FAEE",
            "accent": "#E63946",
        },
        "corporate-blue": {
            "primary": "#1E3A8A",
            "secondary": "#3B82F6",
            "accent": "#60A5FA",
        },
        "earthy-terracotta": {
            "primary": "#A0522D",
            "secondary": "#CD853F",
            "accent": "#DEB887",
        },
        "neon-cyber": {
            "primary": "#00F5FF",
            "secondary": "#FF00FF",
            "accent": "#39FF14",
        },
        "vintage-sepia": {
            "primary": "#8B4513",
            "secondary": "#A0522D",
            "accent": "#D2691E",
        },
    }

    if theme_name not in themes:
        print(f"⚠️  Theme '{theme_name}' not found, skipping theme application.")
        return

    # Find CSS files and update color variables
    css_files = list(project_path.rglob("*.css"))
    theme_colors = themes[theme_name]

    for css_file in css_files:
        content = css_file.read_text()

        # Replace color variables
        for color_key, color_value in theme_colors.items():
            content = content.replace(f"--{color_key}:", f"--{color_key}: {color_value};  /* {theme_name} theme */")

        css_file.write_text(content)

    print(f"   Applied colors: primary={theme_colors['primary']}, secondary={theme_colors['secondary']}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize frontend project with template and theme")
    parser.add_argument("--template", required=True, choices=TEMPLATES, help="Template to use")
    parser.add_argument("--theme", choices=THEMES, help="Color theme to apply")
    parser.add_argument("--output", required=True, help="Output directory path")

    args = parser.parse_args()

    setup_project(args.template, args.theme, args.output)
