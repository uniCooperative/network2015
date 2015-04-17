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
