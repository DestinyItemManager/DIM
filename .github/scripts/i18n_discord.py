#!/usr/bin/env python3
"""
Discord i18n diff helper for DIMi18n.
Used by .github/workflows/notify-discord-i18n.yml

Usage:
  python3 i18n_discord.py

Environment variables:
  DISCORD_I18N_WEBHOOK  — required (posts the diff embed)
"""

import json
import os
import subprocess
import sys
import urllib.request
import urllib.error

LOCALE_FILE = "src/locale/en.json"
CHUNK_SIZE = 4000  # safely under Discord's 4096 embed limit
ROLE_MENTION = "<@&622449489008918548>"
AVATAR_URL = "https://raw.githubusercontent.com/DestinyItemManager/DIM/refs/heads/master/icons/pr/android-chrome-mask-512x512-6-2018.png"
COLOR = 0xFF64E7
CROWDIN_URL = "https://crowdin.com/project/destiny-item-manager"


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


# ── Markdown report ────────────────────────────────────────────────────────────

MAX_VALUE_LEN = 100

def fmt(value):
    """Format a value for display, truncating if needed."""
    if value is None:
        return "`null`"
    s = f'"{value}"' if isinstance(value, str) else json.dumps(value)
    if len(s) > MAX_VALUE_LEN:
        s = s[:MAX_VALUE_LEN] + "..."
    return f"`{s}`"


def generate_report(diff, total):
    added = diff["added"]
    modified = diff["modified"]
    removed = diff["removed"]

    lines = [
        "## Summary\n",
        f"**Total Changes:** {total}\n",
        f"- **Added Translation(s):** {len(added)}",
        f"- **Modified Translation(s):** {len(modified)}",
        f"- **Removed Translation(s):** {len(removed)}",
    ]

    if added:
        lines.append(f"\n## ➕ Added Keys ({len(added)})\n")
        for i, c in enumerate(added, 1):
            lines.append(f"### {i}. `{c['path']}`\n")
            lines.append(fmt(c["new"]))

    if modified:
        lines.append(f"\n## 🔄 Modified Keys ({len(modified)})\n")
        for i, c in enumerate(modified, 1):
            lines.append(f"### {i}. `{c['path']}`\n")
            lines.append(f"<:minus:1105075710818783372> {fmt(c['old'])}")
            lines.append(f"<:plus:1105075707593371738> {fmt(c['new'])}")

    if removed:
        lines.append(f"\n## ➖ Removed Keys ({len(removed)})\n")
        for i, c in enumerate(removed, 1):
            lines.append(f"### {i}. `{c['path']}`\n")
            lines.append(f"**Previous Value:** {fmt(c['old'])}")

    return "\n".join(lines)


# ── Discord posting ────────────────────────────────────────────────────────────

def chunk_content(content):
    """Split content into <=CHUNK_SIZE chunks on newline boundaries."""
    chunks = []
    current = ""
    for line in content.splitlines(keepends=True):
        if len(current) + len(line) > CHUNK_SIZE:
            chunks.append(current.rstrip())
            current = line
        else:
            current += line
    if current.strip():
        chunks.append(current.rstrip())
    return chunks


def post_to_discord(report):
    webhook = os.environ["DISCORD_I18N_WEBHOOK"]
    chunks = chunk_content(report)

    for i, chunk in enumerate(chunks):
        payload = {
            "username": "i18n Bot",
            "avatar_url": AVATAR_URL,
            "content": ROLE_MENTION if i == 0 else "",
            "embeds": [{
                "title": "DIM - crowdin",
                "url": CROWDIN_URL,
                "description": chunk,
                "color": COLOR,
            }]
        }
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            webhook, data=data,
            headers={"Content-Type": "application/json"}
        )
        try:
            urllib.request.urlopen(req)
            print(f"Posted chunk {i + 1}/{len(chunks)} ({len(chunk)} chars)")
        except urllib.error.HTTPError as e:
            print(f"HTTP {e.code}: {e.read().decode()}")
            raise


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
    total = len(diff["added"]) + len(diff["modified"]) + len(diff["removed"])

    if total == 0:
        print("No changes detected, skipping Discord post.")
        sys.exit(0)

    report = generate_report(diff, total)
    post_to_discord(report)
