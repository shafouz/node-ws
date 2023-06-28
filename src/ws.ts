import { WebSocketServer, WebSocket } from "ws";
import moment from "moment";

export type Room = {
  id: number;
  users: User[];
};

type User = {
  name: string;
  messages: Message[];
  connection: WebSocket;
};

type Message = {
  message: string;
  timestamp: string;
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
      let user: User | undefined;

      if (room) {
        // room case
        // check if user is not in room
        // add user to room
        user = room.users.find((user) => user.name === parsed.user);

        if (!user) {
          // create user
          user = {
            name: parsed.user,
            messages: [],
            connection: ws,
          };

          // add user to room
          room.users.push(user);
        }
      } else {
        // no room case
        // create new room
        // add user to room
        // add room to rooms
        room = {
          id: roomId,
          users: [],
        };

        user = {
          name: parsed.user,
          messages: [],
          connection: ws,
        };

        room.users.push(user);
        rooms.push(room);
      }

      parsed.timestamp = moment(Date.now()).format("HH:mm:ss");

      let message: Message = {
        message: parsed.message,
        timestamp: parsed.timestamp,
      };

      user?.messages.push(message);

      room.users.forEach((__user) => {
        if (__user.connection.readyState === WebSocket.OPEN) {
          // let pp = rooms.map((room) =>
          //   room.users.map((user) => {
          //     return { user: user.name, messages: user.messages };
          //   })
          // );
          // console.log(JSON.stringify(pp));

          __user.connection.send(JSON.stringify(parsed));
        }
      });
    });
  });

  return wss;
}

export { startWebSocketServer };
