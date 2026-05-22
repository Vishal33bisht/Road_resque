import json
from collections import defaultdict

from fastapi import WebSocket


class RequestLocationManager:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)
        self._user_connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(self, request_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[request_id].add(websocket)

    async def connect_user(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._user_connections[user_id].add(websocket)

    def disconnect(self, request_id: int, websocket: WebSocket) -> None:
        connections = self._connections.get(request_id)
        if not connections:
            return

        connections.discard(websocket)
        if not connections:
            self._connections.pop(request_id, None)

    def disconnect_user(self, user_id: int, websocket: WebSocket) -> None:
        connections = self._user_connections.get(user_id)
        if not connections:
            return

        connections.discard(websocket)
        if not connections:
            self._user_connections.pop(user_id, None)

    async def broadcast(self, request_id: int, payload: dict) -> None:
        connections = list(self._connections.get(request_id, set()))
        await self._broadcast_to_connections(connections, payload, request_id=request_id)

    async def broadcast_to_user(self, user_id: int, payload: dict) -> None:
        connections = list(self._user_connections.get(user_id, set()))
        await self._broadcast_to_connections(connections, payload, user_id=user_id)

    async def _broadcast_to_connections(
        self,
        connections: list[WebSocket],
        payload: dict,
        request_id: int | None = None,
        user_id: int | None = None,
    ) -> None:
        stale_connections: list[WebSocket] = []
        message = json.dumps(payload, default=str)

        for websocket in connections:
            try:
                await websocket.send_text(message)
            except RuntimeError:
                stale_connections.append(websocket)

        for websocket in stale_connections:
            if request_id is not None:
                self.disconnect(request_id, websocket)
            if user_id is not None:
                self.disconnect_user(user_id, websocket)


request_location_manager = RequestLocationManager()
