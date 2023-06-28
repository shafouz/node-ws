import { WebSocketServer, WebSocket } from "ws";

export type Room = {
  id: number;
  users: string[];
  connections: WebSocket[];
  messages: string[];
};

// on connect create a new room
// add user to room
function startWebSocketServer(rooms: Room[]): WebSocketServer {
  const wss = new WebSocketServer({ port: 8001 });

  wss.on("connection", function connection(ws) {
    ws.on("error", console.error);

    ws.on("message", function message(data) {
      let parsed = JSON.parse(data.toString());
      let roomId = parseInt(parsed.room);
      roomId = isNaN(roomId) ? 0 : roomId;

      let room = rooms.find((room) => room.id === roomId);

      if (room) {
        if (!room.users.includes(parsed.user)) {
          room.connections.push(ws);
          room.users.push(parsed.user);
        }
      } else {
        // create new room
        rooms.push({
          id: roomId,
          connections: [ws],
          users: [parsed.user],
          messages: [],
        });

        // update room value to new room
        room = {
          id: roomId,
          connections: [ws],
          users: [parsed.user],
          messages: [],
        };
      }

      room.connections.forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN) {
          room?.messages.push(parsed.message);
          socket.send(data.toString());
        }
      });
    });
  });

  return wss;
}

export { startWebSocketServer };
