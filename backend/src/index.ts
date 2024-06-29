import express from "express"
import { Server, Socket } from "socket.io"
import http from "http"

const app = express();
const server = http.createServer(http);

const io = new Server(server);

io.on('connection', (socket : Socket)=>{
    console.log("a new user is created")
})

server.listen(3000, ()=>{
    console.log('listening on *:3000')
})