#!/usr/bin/env python3
"""
Discord changelog helper for DIMmit.
Used by .github/workflows/notify-discord-changelog.yml

Usage:
  python3 discord_changelog.py

Environment variables:
  DISCORD_CHANGELOG_BOT_TOKEN  — required (deletes existing beta messages before posting)
  DISCORD_CHANGELOG_WEBHOOK    — required (posts the new changelog embed)
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.error

CHANGELOG_FILE = "docs/CHANGELOG.md"
CHANNEL_ID = "894808801109245952"
BETA_AVATAR_HASH = "5153E66D003AFF489DC73FF9EE151A6F"
CHUNK_SIZE = 4000  # safely under Discord's 4096 embed limit

ICONS_BASE = "https://raw.githubusercontent.com/DestinyItemManager/DIM/refs/heads/master/icons"
AVATAR_BETA = f"{ICONS_BASE}/beta/favicon-96x96.png"
AVATAR_PROD = f"{ICONS_BASE}/release/favicon-96x96.png"

PROFILES = {
    "beta": {"avatar_url": AVATAR_BETA, "color": 0x68A0B7},
    "prod": {"avatar_url": AVATAR_PROD, "color": 0xF37423},
}


# ── Changelog parsing ──────────────────────────────────────────────────────────

def _sections():
    """Return a dict of {heading: body} parsed from CHANGELOG.md."""
    with open(CHANGELOG_FILE) as f:
        content = f.read()
    parts = re.split(r"^(## .*)", content, flags=re.MULTILINE)
    result = {}
    for i, part in enumerate(parts):
        if part.startswith("## ") and i + 1 < len(parts):
            result[part.strip()] = parts[i + 1].strip()
    return result


def detect_profile(sections):
    """Return 'beta', 'prod', or 'none' based on changelog content."""
    beta_body = sections.get("## Next", "")
    if re.search(r"^\*", beta_body, re.MULTILINE):
        return "beta"
    for heading, body in sections.items():
        if re.match(r"## \d", heading) and re.search(r"^\*", body, re.MULTILINE):
            return "prod"
    return "none"


def get_content(sections, profile):
    """Return formatted Discord content for the given profile."""
    if profile == "beta":
        return "### Destiny Item Manager - BETA\n" + sections.get("## Next", "")
    if profile == "prod":
        for heading, body in sections.items():
            if re.match(r"## \d", heading):
                version = re.sub(r"<.*?>", "", heading[3:]).strip()
                return f"### Destiny Item Manager v{version}\n" + body
    return ""


# ── Discord API helpers ────────────────────────────────────────────────────────

def bot_api(method, path, token, data=None):
    url = f"https://discord.com/api/v10/{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(
        url, data=body,
        headers={"Authorization": f"Bot {token}", "Content-Type": "application/json"},
        method=method
    )
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code} on {method} {path}: {e.read().decode()}")
        raise


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


# ── Commands ───────────────────────────────────────────────────────────────────

def delete_beta():
    """Delete all beta-avatar messages from the changelog channel."""
    token = os.environ["DISCORD_CHANGELOG_BOT_TOKEN"]

    messages = []
    last_id = None
    while True:
        path = f"channels/{CHANNEL_ID}/messages?limit=100"
        if last_id:
            path += f"&before={last_id}"
        batch = bot_api("GET", path, token)
        if not batch:
            break
        messages.extend(batch)
        if len(batch) < 100:
            break
        last_id = batch[-1]["id"]

    deleted = 0
    for msg in messages:
        if msg.get("author", {}).get("avatar", "").upper() == BETA_AVATAR_HASH:
            bot_api("DELETE", f"channels/{CHANNEL_ID}/messages/{msg['id']}", token)
            deleted += 1
            time.sleep(0.5)  # stay under rate limit

    print(f"Deleted {deleted} beta message(s)")



# ── Entrypoint ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    sections = _sections()
    profile = detect_profile(sections)

    if profile == "none":
        print("No changelog content detected, skipping Discord post.")
        sys.exit(0)

    content = get_content(sections, profile)
    delete_beta()

    webhook = os.environ["DISCORD_CHANGELOG_WEBHOOK"]
    avatar = PROFILES[profile]

    for chunk in chunk_content(content):
        payload = {
            "username": "DIMmit",
            "avatar_url": avatar["avatar_url"],
            "content": "",
            "embeds": [{"description": chunk, "color": avatar["color"]}]
        }
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            webhook, data=data,
            headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req)
        print(f"Posted chunk ({len(chunk)} chars)")
