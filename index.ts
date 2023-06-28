import { readFileSync } from "fs";
import * as http from "http";
import { startWebSocketServer, Room } from "./src/ws";
import { render } from "ejs";

const port = 8000;
const host = `localhost:${port}`;

let rooms: Room[] = [];

// ws server
startWebSocketServer(rooms);
console.log(`Started ws server on port ${8001}`);

const server = http.createServer((req, res) => {
  // get query for room
  // render room messages on first load?
  let url = new URL(req.url ? req.url : host, `http://${req.headers.host}`);

  let roomId = parseInt(url.searchParams.get("room") ?? "0");
  let room = rooms.find((room) => room.id === roomId);

  let page = readFileSync("./index.html");

  // console.log("DEBUGPRINT[3]: index.ts:25: rooms=", rooms);
  // console.log("DEBUGPRINT[2]: index.ts:25: room=", room);

  let html = "";
  if (room !== undefined) {
    html = render(page.toString(), { messages: room.messages });
  } else {
    html = render(page.toString(), { messages: [] });
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
});

console.log(`Started on port ${port}`);
server.listen(port);
