import { WebSocketServer, WebSocket } from "ws";
import moment from "moment";

export type Room = {
  id: number;
  users: User[];
};

type User = {
  name: string;
  messages: Message[];
  connection: WebSocketWithUsername;
};

type WebSocketWithUsername = WebSocket & {
  username: string;
  room: number;
};

type Message = {
  message: string;
  timestamp: string;
};

function printRooms(rooms: Room[]) {
  let pp = rooms.map((room) =>
    room.users.map((user) => {
      return { user: user.name, messages: user.messages };
    })
  );
  console.log(JSON.stringify(pp));
}

function get_room_and_user(
  parsed: any,
  rooms: Room[],
  ws: WebSocketWithUsername
): { user: User; room: Room } {
  let user: User = {
    name: "",
    messages: [],
    connection: ws,
  };

  let roomId = parsed.room;
  let room = rooms.find((room) => room.id === roomId);

  if (room) {
    // room case
    // check if user is not in room
    // add user to room
    let user_check = room.users.find((user) => user.name === parsed.user);

    if (!user_check) {
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

  return { user, room };
}

function startWebSocketServer(rooms: Room[]): WebSocketServer {
  const wss = new WebSocketServer({ port: 8001 });

  wss.on("connection", function connection(ws: WebSocketWithUsername) {
    const pingInterval = 2500; // Interval in milliseconds (e.g., 5 seconds)

    const pingIntervalId = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        // console.log("ping");
        ws.ping();
      }
    }, pingInterval);

    ws.on("pong", () => {
      // console.log("pong");
    });

    ws.on("close", () => {
      clearInterval(pingIntervalId);
      ws.terminate();

      let room = rooms.find((room) => room.id === ws.room);

      room?.users.splice(
        room?.users.findIndex((user) => user.name === ws.username),
        1
      );
    });

    ws.on("message", function message(data) {
      let parsed = JSON.parse(data.toString());

      let { room, user } = get_room_and_user(parsed, rooms, ws);
      console.log("DEBUGPRINT[13]: ws.ts:121: room=", room);
      console.log("DEBUGPRINT[14]: ws.ts:122: user=", user.name);

      parsed.timestamp = moment(Date.now()).format("HH:mm:ss");
      let message = {
        message: parsed.message,
        timestamp: parsed.timestamp,
      };
      user?.messages.push(message);

      room?.users.forEach((__user) => {
        if (__user.connection.readyState === WebSocket.OPEN) {
          // printRooms(rooms);

          __user.connection.send(JSON.stringify(parsed));
        }
      });

      // bad
      ws.username = user.name;
      ws.room = room.id;
    });
  });

  return wss;
}

export { startWebSocketServer, printRooms };
