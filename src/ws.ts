import { WebSocketServer, WebSocket } from "ws";
import moment from "moment";

// users never changes
// but online users does
// active_users: string[], splice this instead of users
// add user here on connection
// remove on close
// diff between users and active users, red/green?
export type Room = {
  id: number;
  users: User[];
  active_users: string[];
};

type User = {
  name: string;
  messages: Message[];
  connection: WebSocketWithMetadata;
};

type WebSocketWithMetadata = WebSocket & {
  user: User;
  room: Room;
};

type Message = {
  user: string;
  message: string;
  timestamp: string;
};

function isValidMessage(message: string): boolean {
  let res = !(
    message === undefined ||
    /^\s+$/.test(message) ||
    message === null ||
    message === ""
  );

  return res;
}

function handleMessage(parsed: any): Message {
  return {
    user: parsed.user,
    message: parsed.message,
    timestamp: moment(Date.now()).format("HH:mm:ss"),
  };
}

function printRooms(rooms: Room[]) {
  let pp = rooms.map((room) =>
    room.users.map((user) => {
      return { user: user.name, messages: user.messages };
    })
  );
  console.log(JSON.stringify(pp));
}

function parse_int_no_nan(some_number_str: string): number {
  let temp_room_id = parseInt(some_number_str);
  return Number.isNaN(temp_room_id) ? 0 : temp_room_id;
}

function handle_user_and_room(
  parsed: any,
  rooms: Room[],
  ws: WebSocketWithMetadata
): { user: User; room: Room; message: Message } {
  let user: User = {
    name: "",
    messages: [],
    connection: ws,
  };

  let room_id = parse_int_no_nan(parsed.room);
  let room = rooms.find((room) => room.id === room_id);
  let message = handleMessage(parsed);

  if (room) {
    // room case
    // check if user is not in room
    // add user to room
    let user_index = room.users.findIndex((user) => user.name === parsed.user);

    if (user_index === -1) {
      // create user
      user = {
        name: parsed.user,
        messages: [],
        connection: ws,
      };

      // add user to room
      if (isValidMessage(message.message)) {
        user.messages.push(message);
      }

      room.users.push(user);
    } else {
      user = room.users[user_index];

      user.connection = ws;

      if (isValidMessage(message.message)) {
        user.messages.push(message);
      }
    }
  } else {
    // no room case
    // create new room
    // add user to room
    // add room to rooms
    room = {
      id: room_id,
      users: [],
      active_users: [],
    };

    user = {
      name: parsed.user,
      messages: [],
      connection: ws,
    };

    if (isValidMessage(message.message)) {
      user.messages.push(message);
    }
    room.users.push(user);
    rooms.push(room);
  }

  ws.user = user;
  ws.room = room;

  return { user, room, message };
}

function startWebSocketServer(rooms: Room[]): WebSocketServer {
  const wss = new WebSocketServer({ port: 8001 });

  wss.on("connection", function connection(ws: WebSocketWithMetadata) {
    ws.on("message", (data) => {
      let parsed = JSON.parse(data.toString());
      console.log("DEBUGPRINT[2]: ws.ts:144: parsed=", parsed);

      if (parsed.message_type === "open") {
        let { user, room } = handle_user_and_room(parsed, rooms, ws);
        room.active_users.push(user.name);
        parsed.message_type = "user_add";

        user.connection.send(JSON.stringify(parsed));
        return;
      }

      let { room, message } = handle_user_and_room(parsed, rooms, ws);

      room.users.forEach((__user) => {
        if (__user.connection.readyState === WebSocket.OPEN) {
          // printRooms(rooms);

          __user.connection.send(JSON.stringify(message));
        }
      });
    });

    ws.on("close", () => {
      ws.room?.active_users.splice(
        ws.room?.active_users.findIndex(
          (username) => username === ws.user.name
        ),
        1
      );

      ws.user.connection.send(
        JSON.stringify({
          message_type: "user_remove",
          user: ws.user.name,
        })
      );

      clearInterval(pingIntervalId);
      ws.terminate();
    });

    const pingInterval = 2500; // Interval in milliseconds (e.g., 5 seconds)

    const pingIntervalId = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        // console.log("ping");
        ws.ping();
      }
    }, pingInterval);

    ws.on("pong", () => {});

    ws.on("error", (err) => {
      console.log("DEBUGPRINT[4]: ws.ts:159: err=", err);
    });
  });

  return wss;
}

export { startWebSocketServer, printRooms, parse_int_no_nan };
