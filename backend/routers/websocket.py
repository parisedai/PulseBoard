import json

from fastapi import WebSocket


async def websocket_endpoint(websocket: WebSocket, company_name: str):
    await websocket.accept()
    try:
        await websocket.send_text(
            json.dumps({
                "status": "error",
                "message": "WebSockets are disabled for PulseBoard. Use the HTTP /analyze/{company_name} endpoint instead.",
            })
        )
    finally:
        await websocket.close()