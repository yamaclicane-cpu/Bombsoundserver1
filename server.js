const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

const rooms = new Map();

function joinRoom(ws, room) {
  if (ws.room && rooms.has(ws.room)) {
    rooms.get(ws.room).delete(ws);
    if (rooms.get(ws.room).size === 0) {
      rooms.delete(ws.room);
    }
  }
  ws.room = room;
  if (!rooms.has(room)) {
    rooms.set(room, new Set());
  }
  rooms.get(room).add(ws);
}

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch (_) {
      return;
    }

    if (data.type === "join" && typeof data.room === "string" && data.room.trim()) {
      joinRoom(ws, data.room.trim());
      return;
    }

    if (data.type === "event" && ws.room && rooms.has(ws.room)) {
      const payload = JSON.stringify({
        type: "event",
        action: data.action
      });
      for (const client of rooms.get(ws.room)) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    }
  });

  ws.on("close", () => {
    if (ws.room && rooms.has(ws.room)) {
      rooms.get(ws.room).delete(ws);
      if (rooms.get(ws.room).size === 0) {
        rooms.delete(ws.room);
      }
    }
  });
});

console.log(`WebSocket HUD server running on port ${PORT}`);
