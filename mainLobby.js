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

var positions = [];
var players = [];
var rooms = [];

// join without waiting for media
webrtc.joinRoom('Lobby225346');

// called when a peer is created
webrtc.on('createdPeer', function (peer) {
	console.log('createdPeer', peer);
	var channel = peer.getDataChannel("message");
	peer.on('channelClose', function (channel, error) {
		console.log("Losed data channel", channel, error);
		console.log("Should remove player");
	});

	//handle incoming data
	peer.on('channelMessage', function (peer, channel, msg) {
		// check type, has to be json
		if(msg.type === "json"){
			doStuff(peer, msg.payload);
		}
	});

	peer.name = "Guest";
	updateUser();
	printPlayer();
});

webrtc.on('joinedRoom', function (room) {
	console.log("entered room " + room);
});

function printPlayer(){
	var div = document.getElementById("peers");
	var allPeers = webrtc.webrtc.peers;
	div.innerHTML = "";
	for (var i = 0; i < allPeers.length; i++){
		div.innerHTML += allPeers[i].name + "</p>";
	}
}
function printRoom(){
	var div = document.getElementById("roomList");
	div.innerHTML = "";
	for (var i = 0; i < rooms.length; i++){
		div.innerHTML += rooms[i] + "</p>";
	}
}


function updateUser(){
	var name = document.getElementById("username").value;
	if (name === "")
		name = "Guest";
	sendAll({msg: "Hi, I changed my name to" + name, job: "associate", name: name});
	document.getElementById("nickname").innerHTML = name;
}

function updateRoom(){
  var room = document.getElementById("room").value;
	if (room !== ""){
	  sendAll({msg: "I created the room " + room, job: "createRoom", room: room});
  }
}



//send a json to a peer
function sendPeer(peer, data){
	//create data channel
	var channel = peer.getDataChannel("message");

	var isOpen = peer.sendDirectly("message", "json", data);
	if(isOpen){}
		//console.log("Data send");
	else{
		//retry when channel is open
		var saveOldOnopen = channel.onopen;
		channel.onopen = function() {
			sendPeer(peer, data);
			channel.onopen = saveOldOnopen;
		}
		console.log("Problem sending data");
	}
}

//send a json to all peers
function sendAll(data){
	var peers = webrtc.webrtc.peers;
	for (var i = 0; i < peers.length; i++) {
		sendPeer(peers[i], data);
	}
}

function doStuff(peer, data){
	switch (data.job) {
		case "posInit":
			players.push({id: peer.id, rnd: data.rnd});
			if(players.length === 4)
				sortPlayer();
			break;
		case "move":
			//console.log(data);
			movePaddle(peer.id, data.direction);
			break;
    case "associate":
			peer.name = data.name;
			printPlayer();
		case "createRoom"
      rooms.push(data.room);
      printRoom();
		default:
			console.log(data);
	}
	//y = data.y;
	//console.log(y);
}
