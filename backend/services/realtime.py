import json
from collections import defaultdict

from fastapi import WebSocket


class RequestLocationManager:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, request_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[request_id].add(websocket)

    def disconnect(self, request_id: int, websocket: WebSocket) -> None:
        connections = self._connections.get(request_id)
        if not connections:
            return

        connections.discard(websocket)
        if not connections:
            self._connections.pop(request_id, None)

    async def broadcast(self, request_id: int, payload: dict) -> None:
        connections = list(self._connections.get(request_id, set()))
        stale_connections: list[WebSocket] = []
        message = json.dumps(payload, default=str)

        for websocket in connections:
            try:
                await websocket.send_text(message)
            except RuntimeError:
                stale_connections.append(websocket)

        for websocket in stale_connections:
            self.disconnect(request_id, websocket)


request_location_manager = RequestLocationManager()
