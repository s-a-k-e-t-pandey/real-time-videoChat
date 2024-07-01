import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";



export interface User{
    socket: Socket,
    name: string
}

export class UserManager{
    private users: User[];
    private queue: string[];
    private roomManager: RoomManager;

    constructor(){
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager();
    }

    addUser(name: string, socket: Socket){                                  
        this.users.push({
            name, socket
        })
        this.queue.push(socket.id);
        socket.send("lobby");
        this.clearQueue();
        this.initHandlers(socket);
    }

    removeUser(socketId: string){
        const user = this.users.find(x => x.socket.id === socketId);
        this.users = this.users.filter(x => x.socket.id !== socketId);
        this.queue = this.queue.filter(x=> x===socketId);
    }

    clearQueue(){
        if(this.queue.length < 2){
            return;
        }
        const id1 = this.queue.pop();
        const id2 = this.queue.pop();
        console.log(`id1: ${id1} " " ${id2}`)                                                           
        const user1 = this.users.find(x => x.socket.id === id1)
        const user2 = this.users.find(x => x.socket.id === id2)
        if(!user1 || !user2){
            return;
        }

        console.log("creating room")
        const room = this.roomManager.createRoom(user1, user2);
        console.log(room)
        this.clearQueue();
    }

    initHandlers(socket: Socket){
        socket.on("offer", ({sdp, roomId}: {sdp: string, roomId: string})=>{
            console.log("offer is ready")
            this.roomManager.onOffer(sdp, roomId, socket.id);
        })

        socket.on("answer", ({sdp, roomId}: {sdp: string, roomId: string})=>{
            console.log("anser is ready")
            this.roomManager.onAnswer(sdp, roomId, socket.id)
        })

        socket.on("add-ice-candidate", ({candidate, roomId, type})=>{
            this.roomManager.oIceCandidates(roomId, socket.id, candidate, type);
        })
    }
}