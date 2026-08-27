#!/usr/bin/env python3
"""Build a WordPress plugin zip from the repo, honoring .distignore."""

from __future__ import annotations

import argparse
import re
import sys
import zipfile
from pathlib import Path

PLUGIN_SLUG = "happybites"


def read_version(plugin_root: Path) -> str:
    header = (plugin_root / "happybites.php").read_text(encoding="utf-8")
    match = re.search(r"Version:\s*([0-9]+(?:\.[0-9]+)*)", header)
    if not match:
        raise SystemExit("Could not read Version from happybites.php")
    return match.group(1)


def read_distignore(plugin_root: Path) -> list[str]:
    path = plugin_root / ".distignore"
    if not path.exists():
        path = plugin_root / "distignore"
    if not path.exists():
        raise SystemExit("Missing .distignore")

    rules: list[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        rules.append(line)
    return rules


def should_exclude(relative: str, rules: list[str]) -> bool:
    normalized = relative.replace("\\", "/")
    excluded = False

    for rule in rules:
        if rule.startswith("!"):
            continue
        if _matches_rule(normalized, rule):
            excluded = True
            break

    if not excluded:
        return False

    for rule in rules:
        if not rule.startswith("!"):
            continue
        if _matches_rule(normalized, rule[1:]):
            return False

    return True


def _matches_rule(normalized: str, rule: str) -> bool:
    if rule.endswith("/"):
        directory = rule.rstrip("/")
        return normalized == directory or normalized.startswith(directory + "/")

    if "*" in rule:
        name = Path(normalized).name
        pattern = re.escape(rule).replace(r"\*", ".*")
        return bool(re.fullmatch(pattern, normalized) or re.fullmatch(pattern, name))

    return normalized == rule or normalized.startswith(rule + "/")


def package(plugin_root: Path, zip_path: Path) -> None:
    rules = read_distignore(plugin_root)
    zip_path.parent.mkdir(parents=True, exist_ok=True)

    files: list[Path] = []
    for path in plugin_root.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(plugin_root).as_posix()
        if should_exclude(relative, rules):
            continue
        files.append(path)

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            relative = path.relative_to(plugin_root).as_posix()
            archive.write(path, f"{PLUGIN_SLUG}/{relative}")

    validate_zip(zip_path)


def validate_zip(zip_path: Path) -> None:
    with zipfile.ZipFile(zip_path) as archive:
        entries = [name.replace("\\", "/").rstrip("/") for name in archive.namelist()]

    main = f"{PLUGIN_SLUG}/happybites.php"
    if main not in entries:
        raise SystemExit(f"ZIP is missing {main}")

    mains = [name for name in entries if name == main or name.endswith("/happybites.php")]
    if len(mains) != 1:
        raise SystemExit(f"ZIP must contain exactly one happybites.php, found {mains}")

    nested = [name for name in entries if name.startswith(f"{PLUGIN_SLUG}/{PLUGIN_SLUG}/")]
    if nested:
        raise SystemExit("ZIP contains a nested plugin folder")

    if any(name.startswith(f"{PLUGIN_SLUG}/.git") or name.startswith(".git/") for name in entries):
        raise SystemExit("ZIP must not include .git metadata")

    if any(name.startswith(f"{PLUGIN_SLUG}/dist/") for name in entries):
        raise SystemExit("ZIP must not include dist/")

    if any(name.startswith(f"{PLUGIN_SLUG}/.github/") for name in entries):
        raise SystemExit("ZIP must not include .github/")


def extract_changelog(plugin_root: Path, version: str) -> str:
    readme = (plugin_root / "readme.txt").read_text(encoding="utf-8")
    match = re.search(
        rf"(?ms)^= {re.escape(version)} =\s*\n(.*?)(?=^= |\n== |\Z)",
        readme,
    )
    if not match:
        return (
            f"## HappyBites {version}\n\n"
            "See `readme.txt` for details.\n"
        )

    bullets = match.group(1).strip()
    return f"## Changelog ({version})\n\n{bullets}\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    pack = sub.add_parser("package")
    pack.add_argument("--root", type=Path, default=Path.cwd())
    pack.add_argument("--out", type=Path, required=True)

    notes = sub.add_parser("changelog")
    notes.add_argument("--root", type=Path, default=Path.cwd())
    notes.add_argument("--version", required=True)
    notes.add_argument("--out", type=Path, required=True)

    version = sub.add_parser("version")
    version.add_argument("--root", type=Path, default=Path.cwd())

    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = args.root.resolve()

    if args.command == "version":
        sys.stdout.write(read_version(root))
        return 0

    if args.command == "package":
        package(root, args.out.resolve())
        print(f"Wrote {args.out}")
        return 0

    notes = extract_changelog(root, args.version)
    args.out.write_text(notes, encoding="utf-8")
    print(f"Wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
