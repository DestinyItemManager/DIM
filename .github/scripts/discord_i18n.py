#!/usr/bin/env python3
"""
Discord i18n diff helper for DIMi18n.
Used by .github/workflows/notify-discord-i18n.yml

Diffs src/locale/en.json against its previous committed version (HEAD^), so the
checkout must use fetch-depth: 2 (a single-commit checkout has no HEAD^).

Usage:
  python3 discord_i18n.py

Environment variables:
  DISCORD_I18N_WEBHOOK  — required (posts the diff embed)

Depends on shared.py (must be co-located on the runner).
"""

import json
import os
import subprocess
import sys

from shared import post_chunks, debug, notice

LOCALE_FILE = "src/locale/en.json"
ROLE_MENTION = "<@&622449489008918548>"
AVATAR_URL = "https://raw.githubusercontent.com/DestinyItemManager/DIM/refs/heads/master/icons/pr/android-chrome-mask-512x512-6-2018.png"
COLOR = 0xFF64E7
CROWDIN_URL = "https://crowdin.com/project/destiny-item-manager"
USERNAME = "DIMmit i18n"
MAX_VALUE_LEN = 100


# ── JSON diffing ───────────────────────────────────────────────────────────────

def flatten(obj, prefix=""):
    """Flatten a nested JSON object to dot-notation keys."""
    result = {}
    for key, value in obj.items():
        new_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            result.update(flatten(value, new_key))
        else:
            result[new_key] = value
    return result


def compare(old_flat, new_flat):
    """Return a dict of added, modified, and removed keys."""
    old_keys = set(old_flat)
    new_keys = set(new_flat)

    added = [
        {"path": k, "new": new_flat[k]}
        for k in new_keys - old_keys
    ]
    removed = [
        {"path": k, "old": old_flat[k]}
        for k in old_keys - new_keys
    ]
    modified = [
        {"path": k, "old": old_flat[k], "new": new_flat[k]}
        for k in old_keys & new_keys
        if json.dumps(old_flat[k]) != json.dumps(new_flat[k])
    ]

    return {
        "added": sorted(added, key=lambda x: x["path"]),
        "modified": sorted(modified, key=lambda x: x["path"]),
        "removed": sorted(removed, key=lambda x: x["path"]),
    }


# ── Report (changelog-style) ─────────────────────────────────────────────────

def _val(value):
    """Quote/serialize a value for display, truncating if needed (no backticks)."""
    if value is None:
        return "null"
    s = f'"{value}"' if isinstance(value, str) else json.dumps(value)
    return s[:MAX_VALUE_LEN] + "..." if len(s) > MAX_VALUE_LEN else s


def _plural(n):
    return "" if n == 1 else "s"


def generate_report(diff):
    added, modified, removed = diff["added"], diff["modified"], diff["removed"]
    a, m, r = len(added), len(modified), len(removed)

    summary = (
        f"Added  : {a} new translation key{_plural(a)}\n"
        f"Updated: {m} updated translation key{_plural(m)}\n"
        f"Removed: {r} removed translation key{_plural(r)}"
    )

    lines = [
        "### Destiny Item Manager - i18n Updates",
        "",
        "```",
        summary,
        "```",
    ]

    if added:
        lines += ["", "**Added**"]
        for c in added:
            lines.append(f"• `{c['path']}`")

    if modified:
        lines += ["", "**Updated**"]
        for c in modified:
            lines.append(f"• `{c['path']}`")
            lines.append("```diff")
            lines.append(f"- {_val(c['old'])}")
            lines.append(f"+ {_val(c['new'])}")
            lines.append("```")

    if removed:
        lines += ["", "**Removed**"]
        for c in removed:
            lines.append(f"• `{c['path']}`")

    lines += ["", f"[View on Crowdin]({CROWDIN_URL})"]
    return "\n".join(lines)


# ── Entrypoint ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    old_json = subprocess.run(
        ["git", "show", f"HEAD^:{LOCALE_FILE}"],
        capture_output=True, text=True, check=True
    ).stdout

    old = flatten(json.loads(old_json))
    with open(LOCALE_FILE) as f:
        new = flatten(json.load(f))

    diff = compare(old, new)
    total = sum(len(diff[k]) for k in ("added", "modified", "removed"))
    debug(f"diff +{len(diff['added'])} ~{len(diff['modified'])} -{len(diff['removed'])}")

    if total == 0:
        notice("no changes detected, skipping Discord post")
        sys.exit(0)

    report = generate_report(diff)
    webhook = os.environ["DISCORD_I18N_WEBHOOK"]
    post_chunks(webhook, report, username=USERNAME, avatar_url=AVATAR_URL,
                color=COLOR, role_mention=ROLE_MENTION)