import asyncio
import websockets
import json
import logging
import ssl
from pathlib import Path

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

PORT = 9130
CERT_PATH = "/Users/maxschecter/Desktop/DIM-MCP/cert.pem"
KEY_PATH = "/Users/maxschecter/Desktop/DIM-MCP/key.pem"
OUTPUT_PATH = Path.home() / "Desktop" / "dim_inventory.json"

aSYNC_MARKER = object()

async def handle_client(websocket):
    logger.info(f"✅ DIM connected from: {websocket.remote_address}")
    # Buffer structure for new protocol
    state = {
        "stores_expected": None,
        "stores_received": {},   # storeIndex -> {chunks: dict, total: int}
        "stores_final": {},      # storeIndex -> parsed store object
        "currencies": None,
    }
    try:
        while True:
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=180)
            except asyncio.TimeoutError:
                logger.warning("⏱️ No message from DIM within timeout window; closing")
                break

            # Parse JSON
            try:
                msg = json.loads(message)
            except json.JSONDecodeError:
                logger.info(f"📝 Received non-JSON message: {message}")
                continue

            if not isinstance(msg, dict):
                continue

            mtype = msg.get("type")

            # Client hello (no reply needed)
            if mtype == "hello":
                logger.info("👋 Client said hello; waiting for start...")
                continue

            # Start: tells us how many stores to expect
            if mtype == "inventoryStart":
                state["stores_expected"] = int(msg.get("storeCount", 0))
                logger.info(f"🟢 Start: expecting {state['stores_expected']} stores")
                continue

            # Currencies payload
            if mtype == "currencies":
                state["currencies"] = msg.get("data")
                logger.info("💰 Currencies received")
                continue

            # Per-store chunk
            if mtype == "storeChunk":
                idx = int(msg["storeIndex"])  # zero-based
                total = int(msg["totalChunks"])
                chunk_idx = int(msg["chunkIndex"])
                data = msg["data"]

                buf = state["stores_received"].setdefault(idx, {"chunks": {}, "total": total})
                buf["chunks"][chunk_idx] = data
                buf["total"] = total  # keep latest total
                logger.info(f"📦 Store {idx}: received chunk {chunk_idx+1}/{total}")

                # If this store is complete, parse & stash
                if len(buf["chunks"]) == buf["total"]:
                    ordered = [buf["chunks"][i] for i in range(buf["total"])]
                    s_json = "".join(ordered)
                    try:
                        store_obj = json.loads(s_json)
                        state["stores_final"][idx] = store_obj
                        logger.info(f"✅ Store {idx} assembled")
                    except json.JSONDecodeError:
                        logger.error(f"❌ Failed to decode store {idx} JSON; discarding")
                        state["stores_received"].pop(idx, None)
                        continue

                # If all stores done, write final file
                expected = state["stores_expected"]
                if expected is not None and len(state["stores_final"]) == expected:
                    stores_ordered = [state["stores_final"][i] for i in range(expected)]
                    payload = {
                        "stores": stores_ordered,
                        "currencies": state["currencies"],
                    }
                    with open(OUTPUT_PATH, "w") as f:
                        json.dump(payload, f, indent=2)
                    logger.info(f"📁 Saved full inventory with {expected} stores to: {OUTPUT_PATH}")
                    # Optionally ack
                    await websocket.send(json.dumps({"type": "ack", "stores": expected}))
                    # Reset to allow another cycle if needed
                    state = {
                        "stores_expected": None,
                        "stores_received": {},
                        "stores_final": {},
                        "currencies": None,
                    }
                continue

            # Optional: ack logging
            if mtype == "pong":
                logger.info("🔁 Received pong from client")
                continue
    except websockets.exceptions.ConnectionClosed as e:
        logger.info(f"❌ DIM disconnected (code={getattr(e, 'code', '?')}, reason={getattr(e, 'reason', '')})")
    except Exception as e:
        logger.error(f"🚨 WebSocket error: {e}")

async def main():
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        ssl_context.load_cert_chain(CERT_PATH, KEY_PATH)
        logger.info("🔒 Using SSL certificates from DIM")
    except FileNotFoundError:
        logger.error("❌ SSL certificates not found. Run DIM to generate them.")
        return
    except Exception as e:
        logger.error(f"❌ SSL setup error: {e}")
        return

    logger.info(f"🚀 Secure WebSocket server started on wss://localhost:{PORT}")
    logger.info("Waiting for DIM to connect...\n")

    try:
        async with websockets.serve(
            handle_client,
            "localhost",
            PORT,
            ssl=ssl_context,
            ping_interval=None,  # disable protocol pings
            close_timeout=10,
            max_size=None,       # accept messages of any size (our chunks are ~2 MB)
            max_queue=64,        # buffer more frames if needed
        ):
            await asyncio.Future()  # Run forever
    except Exception as e:
        logger.error(f"❌ Server failed to start: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n👋 Shutting down server...")