var PADDLE_LENGHT = 100;
var PADDLE_HEIGHT = 6;
var speedX = -2;
var speedY = -5;
var score = [0, 0, 0, 0];
var players = [];
var playerCount = 0;
var stage;
var master = false;
var ball;
var scoreText;

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

function createRoom() {
	var room = "room" + parseInt(Math.random()*10000);
	if (history.pushState) {
		var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + room;
		window.history.pushState({path:newurl},'',newurl);
	}
	return room;
}
// join without waiting for media
webrtc.joinRoom(window.location.search.replace("?", "").split("&")[0] || createRoom());

// called when a peer is created
webrtc.on('createdPeer', function (peer) {
	console.log('createdPeer', peer);
	var div = document.getElementById("peers");
	var channel = peer.getDataChannel("message");
	var allPeers = webrtc.webrtc.peers;
	peer.on('channelClose', function (channel, error) {
		console.log("Losed data channel", channel, error);
		console.log("Should remove player");
		location.reload();
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
		initGame();
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

function initGame(){
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

function sortPlacePlayer(){
	//Sort Player list
	console.log(players);
	players.sort(function (a, b) {
		if (a.rnd < b.rnd) return -1;
		if (a.rnd > b.rnd) return 1;
		if (a.rnd === b.rnd) return 0;
	});
	for(var i = 1; i < players.length; i++) {
		if (players[i].rnd === players[i-1].rnd)
			return false;
	}
	//Place player
	for(var i = 0; i < players.length; i++){
		//add Paddle
		players[i].element = addPlayer(players[i].id);
		players[i].vertical = (i % 2 == 0)? true: false;
	}
	//stage.update();
	return true;

}

function putangle(){

	var positionX = 1;
	var positionY = 1;

	for(var i = 0; i<4;i++){
		switch(i){
			case 0:  positionX = 1;
							 positionY = 0;
							 putAnglePosition(positionX,positionY);
							 break;
			case 1:  positionX = 0;
							 positionY = 1;
							 putAnglePosition(positionX,positionY);
							 break;
			case 2:  positionX = 1;
							 positionY = 1;
							 putAnglePosition(positionX,positionY);
							 break;
			case 3:  positionX = 0;
							 positionY = 0;
							 putAnglePosition(positionX,positionY);
							 break;
		}

	}
}

function putAnglePosition(positionY,positionX){
	var shape = [];
	shape[0]= new createjs.Shape();
	shape[1]= new createjs.Shape();

	shape[0].graphics.beginFill("White").drawRect(-20/2, -50/2, 20, 50);
	shape[0].x = stage.canvas.width * positionX ;
	shape[0].y = stage.canvas.height * positionY ;
	shape[0].width = 55;
	shape[0].height = 25;
	stage.addChild(shape[0]);
	shape[1].graphics.beginFill("White").drawRect(-50/2, -20/2, 50, 20);
	shape[1].x = stage.canvas.width * positionX;
	shape[1].y = stage.canvas.height* positionY;
	shape[1].width = 25;
	shape[1].height = 55;
	stage.addChild(shape[1]);
}

function doStuff(peer, data){
	switch (data.job) {
		case "posInit":
			players.push({id: peer.id, rnd: data.rnd});
			if(players.length === 4 && !stage) {
				stage = new createjs.Stage("demoCanvas");
				putangle();
				if(sortPlacePlayer() === true)
					startGame();
				else
					choosePositon();
			}
			break;
		case "movePaddle":
			repositionPaddle(peer.id, data.position);
			break;
		case "setBall":
			setBall(data.position);
			break;
		case "newScore":
			setScore(data.score);
			break;
		default:
			console.log(data);
	}
	//y = data.y;
	//console.log(y);
}

function setBall(pos) {
	if(ball) {
		ball.x = pos.x;
		ball.y = pos.y;
	}
}

function setScore(score) {
	scoreText.text = score;
}

//createjs
function init() {

}

function startGame() {
	console.log("Start Game");
	//litle delay before game start
	window.setTimeout(function() {
		addBall();
		addScore();
		//set FPS
		createjs.Ticker.setFPS(15);

		if (beMaster())
			createjs.Ticker.addEventListener("tick", gameLoopMaster);
		else
			createjs.Ticker.addEventListener("tick", gameLoop);

	}, 100);
}
function addBall() {
	ball = new createjs.Shape();
	ball.graphics.beginFill("White").drawRect(-5,-5,10,10);
	ball.x = stage.canvas.width / 2;
	ball.y = stage.canvas.height / 2;
	//ball.snapToPixel = false;
	stage.addChild(ball);
	ball.checkCollision = function(a) {
		var b = {x: this.x, y: this.y, width: 10, height: 10};
		if (b.x - b.width/2 < a.x + a.width/2 && b.y - b.height/2 < a.y + a.height/2 && b.x + b.width/2 > a.x - a.width/2 && b.y + b.height/2 > a.y - a.height/2) {
			return true;
		}
		return false;
	}
}

function addScore() {
	scoreText = new createjs.Text("0,0,0,0", "30px Arial", "#fff");
	scoreText.x = stage.canvas.width / 2;
	scoreText.y = stage.canvas.height / 2;
	scoreText.textAlign = "center";
	scoreText.textBaseline = "middle";
	stage.addChild(scoreText);
}

function gameLoopMaster(event) {
	// Actions carried out each tick (aka frame)
	if (!event.paused) {
		// Actions carried out when the Ticker is not paused.
		var maxWidth = stage.canvas.width;
		var maxHeight = stage.canvas.height;
		//console.log(ball.x, ball.y)
		//collision detection
		for (var i = 0; i < stage.children.length && !collision; i++) {
			//if(stage.children[i].playerId)
			var collision = ball.checkCollision(stage.children[i]);
				paddle = stage.children[i];
			if (collision && paddle.vertical !== undefined) {
				if(paddle.vertical) {
					//value of intresst ball.y
					var hitPos = (ball.y - paddle.y)/50;
					var y = 4 * hitPos;
					speedy = y;
					speedY = Math.sqrt(25 - (y*y));
					console.log(hitPos);

				}
				else {
					//value of intresst ball.x
					var hitPos = (ball.x - paddle.x)/50
					var x = 4 * hitPos;
					speedX = x;
					// where 25 (5*5) is resulting speed
					speedY = Math.sqrt(25 - (x*x));
					console.log(hitPos);
				}
			}
		}

		var hitWall = false;
		//All 4 walls
		var wall = 10;
		if (ball.x + speedX > maxWidth - wall) {
			score[2]++;
			speedX *= -1;
			hitWall = true;
		}
		if (ball.x + speedX < 0 + wall) {
			score[0]++;
			speedX *= -1;
			hitWall = true;
		}
		if (ball.y + speedY > maxHeight - wall) {
			score[1]++;
			speedY *= -1;
			hitWall = true;
		}
		if (ball.y + speedY < 0 + wall) {
			score[3]++;
			speedY *= -1;
			hitWall = true;
		}

		if(hitWall) {
			sendScore(score);
			scoreText.text = score;
		}

		ball.x += speedX;
		ball.y += speedY;
		sendBallPosition(ball.x, ball.y);
		stage.update();
	}

}

function sendBallPosition(x, y) {
	sendAll({msg: "", job: "setBall", position: {x: x, y: y}});
}

function sendScore(score) {
	sendAll({msg: "", job: "newScore", score: score});
}

function gameLoop(event) {
	// Actions carried out each tick (aka frame)
	if (!event.paused) {
		// Actions carried out when the Ticker is not paused.
		stage.update();
	}
}

function beMaster() {
	var id = webrtc.connection.getSessionid();
	if (players[0].id === id)
		return true;
	return false;
}

function checkState() {
	console.log("Hello");
}

function addPlayer(id) {
	console.log("Add player " + id);
	player = new createjs.Shape();
	var pos = findNextPostion();
	if (pos) {
		if (pos.vertical === true) {
			player.graphics.beginFill("White").drawRect(-(PADDLE_LENGHT/2), -PADDLE_HEIGHT/2, PADDLE_LENGHT, PADDLE_HEIGHT);
			player.vertical = false;
			player.width = PADDLE_LENGHT;
			player.height = 10;
		}
		else {
			player.graphics.beginFill("White").drawRect(-PADDLE_HEIGHT/2, -(PADDLE_LENGHT/2), PADDLE_HEIGHT, PADDLE_LENGHT);
			player.vertical = true;
			player.width = 10;
			player.height = PADDLE_LENGHT;
		}
		player.playerId = id;
		player.x = pos.x;
		player.y = pos.y;
		stage.addChild(player);
		console.log(player.width);
		return player;
	}
}


function findNextPostion() {
	var nextPos = playerCount;
	if (nextPos < 4) {
		playerCount++;
		var x, y;
		var width = stage.canvas.width;
		var height = stage.canvas.height;
		var vertical = false;

		switch (nextPos) {
			case 0: x = 5; y = height/2;	break;
			case 1: x = width/2; y = 5; vertical = true;	break;
			case 2: x = width - 5; y = height/2;	break;
			case 3: x = width/2; y = height - 5;	vertical = true; break;
		}
		return {x: x, y: y, vertical: vertical};
	}
	return undefined;
}
function repositionPaddle(peerId, position) {
	var peer = findPaddleToMove(peerId);
	peer.element.x = position.x;
	peer.element.y = position.y;
}

function movePaddle(peerId, direction){
	var step;
	var peer = findPaddleToMove(peerId);
	switch (direction){
		case "up":
			step = -2;
			break;
		case "down":
			step = 2;
			break;
	}

	if(peer.vertical) {
		if(peer.element.y + step - PADDLE_LENGHT/2 > 27 && peer.element.y + step + PADDLE_LENGHT/2 < stage.canvas.height - 27)
			peer.element.y += step;
	}
	else {
		if(peer.element.x + step - PADDLE_LENGHT/2 > 27 && peer.element.x + step + PADDLE_LENGHT/2 < stage.canvas.width - 27)
			peer.element.x += step;
	}
	//stage.update();
	return {x: peer.element.x, y: peer.element.y}
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
				sendAll({msg: "Please move my paddle", job: "movePaddle", position: movePaddle(myId, direction)});
			break;
			//down arrow
		case 40:
			direction = "down"
				sendAll({msg: "Please move my paddle", job: "movePaddle", position: movePaddle(myId, direction)});
			break;
	}
}
