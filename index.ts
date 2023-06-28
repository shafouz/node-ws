import { readFileSync } from "fs";
import * as http from "http";
import {
  startWebSocketServer,
  Room,
  printRooms,
  parse_int_no_nan,
} from "./src/ws";
import { render } from "ejs";
import moment from "moment";

const port = 8000;
const host = `localhost:${port}`;

let rooms: Room[] = [];

// ws server
startWebSocketServer(rooms);
console.log(`Started ws server on port ${8001}`);

function message_template(name: string, message: string, timestamp: string) {
  return `${timestamp} - ${name}: ${message}`;
}

function fmt_active_users(room: Room | undefined): string[] {
  if (room === undefined) {
    return [];
  }

  let users: string[] = [];

  for (const user of room.active_users) {
    users.push(user);
  }

  return users;
}

function fmt_messages(room: Room | undefined): string[] {
  if (room === undefined) {
    return [];
  }

  let messages: string[] = [];

  for (const user of room.users) {
    for (const message of user.messages) {
      messages.push(
        message_template(user.name, message.message, message.timestamp)
      );
    }
  }

  messages.sort((message1, message2) => {
    let m1 = message1.split(" - ")[0];
    let m2 = message2.split(" - ")[0];

    return moment(m1, "HH:mm:ss").diff(moment(m2, "HH:mm:ss"));
  });

  return messages;
}

const server = http.createServer((req, res) => {
  let url = new URL(req.url ? req.url : host, `http://${req.headers.host}`);

  if (url.pathname === "/src/frontend") {
    res.writeHead(200, { "Content-Type": "application/javascript" });
    res.end(readFileSync("./src/frontend.js"));
  } else {
    let room_id = parse_int_no_nan(url.searchParams.get("room") ?? "");
    let room = rooms.find((room) => room.id === room_id);

    let page = readFileSync("./index.html");

    let messages = fmt_messages(room);
    let users = fmt_active_users(room);
    let html = render(page.toString(), { messages, users });

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  }
});

console.log(`Started on port ${port}`);
server.listen(port);
