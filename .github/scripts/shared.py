"""
Shared helpers for the DIM Discord notification scripts.

Imported by discord_changelog.py and i18n_discord.py. All three files must
live in the same directory, and the workflow must run from that directory
(or set PYTHONPATH) so `import shared` resolves on the CI runner.
"""

import json
import urllib.request
import urllib.error

CHUNK_SIZE = 4000        # safely under Discord's 4096 embed limit
REQUEST_TIMEOUT = 10     # seconds
USER_AGENT = "DiscordBot (https://github.com/DestinyItemManager/DIM, 1.0)"


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
        print(f"HTTP {e.code}: {e.read().decode()}")
        raise