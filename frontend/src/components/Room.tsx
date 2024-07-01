import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom"
import { Socket, io } from "socket.io-client";

const URL = "http://localhost:3000"

export default function Room({ name, localAudioTrack, localVideoTrack }: {
    name: string,
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null
}) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [lobby, setLobby] = useState(true);
    const [socket, setSocket] = useState<null | Socket>(null);
    const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
    const [receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteMediaStream, setremoteMediaStream] = useState<MediaStream | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>();
    const localVideoRef = useRef<HTMLVideoElement>();

    useEffect(() => {
        const socket = io(URL)
        socket.on('send-offer', async ({ roomId }) => {
            setLobby(false);
            const pc = new RTCPeerConnection();
            setSendingPc(pc);
            if (localVideoTrack) {
                pc.addTrack(localVideoTrack);
            }

            if (localAudioTrack) {
                pc.addTrack(localAudioTrack);
            }

            pc.onicecandidate = async (e) => {
                if(e.candidate){
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "sender"
                    })
                }
            }
            pc.onnegotiationneeded = async ()=>{
                setTimeout(async ()=>{
                    const sdp = await pc.createOffer();
                    // @ts-ignore
                    pc.setLocalDescription(sdp)
                    socket.emit("offer", {
                        sdp,
                        roomId
                    })
                }, 2000)
            }
        })
        socket.on('offer', async ({ roomId, sdp: remoteSdp }) => {
            setLobby(false);
            const pc = new RTCPeerConnection();
            pc.setRemoteDescription(remoteSdp)
            const sdp = await pc.createAnswer();
            pc.setLocalDescription(sdp)
            const stream = new MediaStream();
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
            setremoteMediaStream(stream);
            setReceivingPc(pc);

            pc.onicecandidate = async (e) => {
                if(e.candidate){
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "receiver"
                    })
                }
            }

            pc.ontrack = (({ track, type }) => {
                if (type == 'audio') {
                    // setRemoteAudioTrack(track);
                    // @ts-ignore
                    remoteVideoRef.current.srcObject.addTrack(track)
                } else {
                    // setRemoteVideoTrack(track);
                    // @ts-ignore
                    remoteVideoRef.current.srcObject.addTrack(track)
                }
                // @ts-ignore
                remoteVideoRef.current.play();
            })
            socket.emit("answer", {
                roomId,
                sdp
            });
        });

        socket.on("answer", ({ roomId, sdp: remoteSdp }) => {
            setLobby(false);
            // @ts-ignore
            setSendingPc(pc => {
                pc?.setRemoteDescription(remoteSdp)
                return pc;
            })
        })

        socket.on("lobby", () => {
            setLobby(true);
        })

        socket.on("add-ice-candidate", ({candidate, type})=>{
            if(type == "sender"){
                setReceivingPc(pc => {
                    pc?.addIceCandidate(candidate);
                    return pc;
                })
            }else{
                setReceivingPc(pc =>{
                    pc?.addIceCandidate(candidate)
                    return pc;
                })
            }
        })

        setSocket(socket)
    }, [name]);

    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
                localVideoRef.current.play();
            }
        }
    }, [localVideoRef])

    return <div>
        Hi {name}
        <video autoPlay width={400} height={400} ref={localVideoRef} ></video>
        {lobby ? "waiting to connect you to someone" : null}
        {lobby ? null : "waiting to connect you to someone"}
        <video autoPlay width={400} height={400} ref={remoteVideoRef} ></video>
    </div>
}