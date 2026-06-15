"""
Shared helpers for the DIM Discord notification scripts.

Imported by discord_changelog.py and discord_i18n.py. All three files must
live in the same directory; invoking a script as `python3 path/to/script.py`
puts that directory on sys.path[0], so `import shared` resolves regardless of
the working directory.
"""

import json
import os
import urllib.request
import urllib.error

CHUNK_SIZE = 4000        # safely under Discord's 4096 embed limit
REQUEST_TIMEOUT = 10     # seconds
USER_AGENT = "DiscordBot (https://github.com/DestinyItemManager/DIM, 1.0)"

_GHA = os.environ.get("GITHUB_ACTIONS") == "true"


# ── Logging ──────────────────────────────────────────────────────────────────
# On GitHub Actions these emit workflow-command annotations. `debug` is only
# rendered when step debug logging is enabled (re-run with debug, or set the
# ACTIONS_STEP_DEBUG repo/secret). Off GHA they fall back to plain prefixed lines.

def _emit(level, msg):
    if _GHA:
        safe = str(msg).replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
        print(f"::{level}::{safe}")
    else:
        print(f"[{level}] {msg}")


def debug(msg):
    _emit("debug", msg)


def notice(msg):
    _emit("notice", msg)


def warn(msg):
    _emit("warning", msg)


def error(msg):
    _emit("error", msg)


# ── Chunking ─────────────────────────────────────────────────────────────────

def chunk_content(content, size=CHUNK_SIZE):
    """Split content into <=size chunks, preferring newline boundaries.

    Lines longer than `size` are hard-split so no chunk ever exceeds the limit.
    """
    chunks = []
    current = ""

    def flush():
        nonlocal current
        if current.strip():
            chunks.append(current.rstrip())
        current = ""

    for line in content.splitlines(keepends=True):
        # a line longer than the limit can't fit any chunk on its own — hard-split it
        while len(line) > size:
            flush()
            piece = line[:size].rstrip()
            if piece:
                chunks.append(piece)
            line = line[size:]
        if len(current) + len(line) > size:
            flush()
        current += line
    flush()
    return chunks


# ── Discord posting ──────────────────────────────────────────────────────────

def post_webhook(webhook_url, payload):
    """POST a single message payload to a Discord webhook."""
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        webhook_url, data=data,
        headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
    )
    try:
        urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT)
    except urllib.error.HTTPError as e:
        error(f"webhook POST failed: HTTP {e.code}: {e.read().decode()}")
        raise


def post_chunks(webhook_url, content, *, username, avatar_url, color, role_mention=None):
    """Chunk `content` and post each piece as a Discord embed via webhook.

    `role_mention`, when given, is placed in the message content of the first
    chunk only.
    """
    chunks = chunk_content(content)
    for i, chunk in enumerate(chunks):
        post_webhook(webhook_url, {
            "username": username,
            "avatar_url": avatar_url,
            "content": role_mention if (role_mention and i == 0) else "",
            "embeds": [{"description": chunk, "color": color}],
        })
        print(f"Posted chunk {i + 1}/{len(chunks)} ({len(chunk)} chars)")