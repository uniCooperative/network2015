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

// join without waiting for media
webrtc.joinRoom('marco');

// called when a peer is created
webrtc.on('createdPeer', function (peer) {
	console.log('createdPeer', peer);
	var div = document.getElementById("peers");
	var channel = peer.getDataChannel("message");
	var allPeers = webrtc.webrtc.peers;
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

	//sendPeer(peer, {msg: "Hi, im Player " + webrtc.connection.getSessionid(), job: "init", positions: positions});
	//addPlayer(peer);
	//stage.update();
	if(allPeers.length === 3){
		console.log("Ready to play");
		startGame();
	}

	div.innerHTML = "";
	for (var i = 0; i < allPeers.length; i++)
		div.innerHTML += allPeers[i].id + "</p>";
});

webrtc.on('joinedRoom', function (room) {
	console.log("entered room " + room);
	//addPlayer(webrtc.connection.getSessionid());
	//stage.update();
});


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

function startGame(){
	players = [];
	choosePositon();
}

function choosePositon(){
	var rnd = Math.floor(Math.random() * 100) + 1;
	var myId = webrtc.connection.getSessionid();
	players.push({id: myId, rnd: rnd});
	sendAll({msg: "Hi, im Player " + rnd, job: "posInit", rnd: rnd});
	console.log(rnd);
}

function sortPlayer(){
	console.log(players);
	players.sort(function (a, b) {
		if (a.rnd < b.rnd) return -1;
		if (a.rnd > b.rnd) return 1;
		if (a.rnd === b.rnd) return 0;
	});
	stage = new createjs.Stage("demoCanvas");
	for(var i = 0; i < players.length; i++){
		players[i].element = addPlayer(players[i].id);
		players[i].horizontal = (i % 2 == 0)? true: false;
	}
	stage.update();
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
		default:
			console.log(data);
	}
	//y = data.y;
	//console.log(y);
}


var y = 0;
var stage;


//createjs
function init() {

}

function addPlayer(id) {
	console.log("Add player " + id);
	player = new createjs.Shape();
	var pos = findNextPostion();
	if (pos) {
		if (pos.horizontal === true)
			player.graphics.beginFill("Crimson").drawRoundRect(0, 0, 100, 10, 5, 5, 5, 5);
		else
			player.graphics.beginFill("Crimson").drawRoundRect(0, 0, 10, 100, 5, 5, 5, 5);
		player.x = pos.x;
		player.y = pos.y;
		stage.addChild(player);
		return player;
	}
}

function findNextPostion() {
	var nextPos = stage.children.length;
	if (nextPos < 4) {
		var x, y;
		var width = stage.canvas.width;
		var height = stage.canvas.height;
		var horizontal = false;

		switch (nextPos) {
			case 0: x = 10; y = height/2;	break;
			case 1: x = width/2; y = 10; horizontal = true;	break;
			case 2: x = width - 10; y = height/2;	break;
			case 3: x = width/2; y = height - 10;	horizontal = true; break;
		}
		return {x: x, y: y, horizontal: horizontal};
	}
	return undefined;
}

function movePaddle(peerId, direction){
	var step;
	switch (direction){
		case "up":
			step = -2;
			break;
		case "down":
			step = 2;
			break;
	}
	//if (y < 0) y = stage.canvas.height % stage.canvas.height;
	if(findPaddleToMove(peerId).horizontal)
		findPaddleToMove(peerId).element.y += step;
	else
		findPaddleToMove(peerId).element.x += step;
	stage.update();
}

function findPaddleToMove(peerId){
	for (var i = 0; i < players.length; i++){
		if (players[i].id === peerId)
			return players[i];
	}
}

//add listener
document.onkeydown = function(e){
	var direction;
	var myId = webrtc.connection.getSessionid();
	switch (e.keyCode){
		//up arrow
		case 38: 
			direction = "up"
			sendAll({msg: "Please move my paddle", job: "move", direction: direction});
			movePaddle(myId, direction);
			break;
			//down arrow
		case 40: 
			direction = "down"
			sendAll({msg: "Please move my paddle", job: "move", direction: direction});
			movePaddle(myId, direction);
			break;
	}
}
