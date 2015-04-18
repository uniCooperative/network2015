var webrtc = new SimpleWebRTC({
	// we don't do video
	localVideoEl: '',
	remoteVideosEl: '',
		// dont ask for camera access
	autoRequestMedia: false,
		// dont negotiate media
	receiveMedia: {
		mandatory: {
			OfferToReceiveAudio: false,
			OfferToReceiveVideo: false
		}
	}
});

// join without waiting for media
webrtc.joinRoom('marco');

// called when a peer is created
webrtc.on('createdPeer', function (peer) {
	console.log('createdPeer', peer);
	var div = document.getElementById("peers");
	peer.getDataChannel("message");
	var allPeers = webrtc.webrtc.peers;
	//handle incoming data
	peer.on('channelMessage', function (peer, channel, msg) {
		// check type, has to be json
		if(msg.type === "json"){
			console.log(msg.payload);
			doStuff(msg.payload);
		}
	});

	for (var i = 0; i < allPeers.length; i++)
		div.innerHTML = allPeers[i].id + "</p>";
});


//send a json to a peer
function sendPeer(peer, data){
	//create data channel
	var channel = peer.getDataChannel("message");

	var isOpen = peer.sendDirectly("message", "json", data);
	if(isOpen)
		console.log("Data send");
	else
		console.log("Problem sending data");
}

//send a json to all peers
function sendAll(data){
	var peers = webrtc.webrtc.peers;
	for (var i = 0; i < peers.length; i++) {
		sendPeer(peers[i], data);
	}
}

function doStuff(data){
	x = data.x;
	y = data.y;
	ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
	ctx.fillRect(data.x % canvas.width, data.y % canvas.height, 10, 10);
}


//canvas

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var x,y;
x = 0;
y = 0;

ctx.fillStyle = "green";
ctx.fillRect(0, 0, 10, 10);

//add listener
document.onkeydown = function(e){
	var step = 1;
	switch (e.keyCode){
		// left arrow
		case 37: 
			x -= step;
			break;
			//up arrow
		case 38: 
			y -= step;
			break;
			//right arrow
		case 39: 
			x += step;
			break;
			//down arrow
		case 40: 
			y += step;
			break;
	}
	if (x < 0) x = canvas.width;
	if (y < 0) y = canvas.height;
	sendAll({x: x, y: y});
	ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
	ctx.fillRect(x % canvas.width, y % canvas.height, 10, 10);
}
