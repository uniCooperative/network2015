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
webrtc.on('createdPeer', function (client) {
	console.log('createdPeer', client);
	document.getElementById("peers").innerHTML += client.id + "<p>";
	doStuff(client);
});


var input = document.getElementById('input');

function doStuff(peer){
	peer.on('channelMessage', function (peer, channel, msg) {
		//console.log(peer, channel, msg);
		if(msg){
			console.log(msg.payload.data);
			document.getElementById("output").innerHTML +=  msg.payload.data + "<p>";
		}
	});

	var channel = peer.getDataChannel("message", {reliable: false});

	channel.onopen = function(data){
		input.addEventListener('input', function() {
			var res = peer.sendDirectly("message", "json", {data: input.value});
			if(res)
				console.log("Data send");
		});
	};
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
	var step = 5;
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
	ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
	ctx.fillRect(x % canvas.width, y % canvas.height, 10, 10);
}
