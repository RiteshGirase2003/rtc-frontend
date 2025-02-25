// app.js
const signalingServer = new WebSocket("https://rtc-share.onrender.com/ws");
let peerConnection;
let sessionId;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

signalingServer.onmessage = async (message) => {
    const data = JSON.parse(message.data);
    if (data.offer) {
        peerConnection = new RTCPeerConnection(config);
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) signalingServer.send(JSON.stringify({ candidate: event.candidate }));
        };
        peerConnection.ontrack = (event) => {
            document.getElementById("screenVideo").srcObject = event.streams[0];
        };
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        signalingServer.send(JSON.stringify({ answer, sessionId }));
    } else if (data.answer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } else if (data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
};

async function startScreenShare() {
    sessionId = Math.random().toString(36).substring(2, 10);
    document.getElementById("sessionId").value = sessionId;
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    document.getElementById("screenVideo").srcObject = stream;
    
    peerConnection = new RTCPeerConnection(config);
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) signalingServer.send(JSON.stringify({ candidate: event.candidate }));
    };
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    signalingServer.send(JSON.stringify({ offer, sessionId }));
}

function joinSession() {
    sessionId = document.getElementById("sessionId").value;
    signalingServer.send(JSON.stringify({ joinSession: sessionId }));
}