import { readFileSync } from "fs";
import * as http from "http";
import { startWebSocketServer, Room } from "./src/ws";
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
  // get query for room
  // render room messages on first load?
  let url = new URL(req.url ? req.url : host, `http://${req.headers.host}`);

  let roomId = parseInt(url.searchParams.get("room") ?? "0");
  let room = rooms.find((room) => room.id === roomId);

  let page = readFileSync("./index.html");

  // console.log("DEBUGPRINT[3]: index.ts:25: rooms=", rooms);
  // console.log("DEBUGPRINT[2]: index.ts:25: room=", room);

  let messages = fmt_messages(room);
  let html = render(page.toString(), { messages });

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
});

console.log(`Started on port ${port}`);
server.listen(port);
