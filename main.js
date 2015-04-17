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


  var fileinput = document.getElementById('input');
  console.log(fileinput);
  fileinput.type = 'file';
  fileinput.disabled = false;

 function doStuff(peer){
  // receiving an incoming filetransfer
  peer.on('fileTransfer', function (metadata, receiver) {
    console.log('incoming filetransfer', metadata.name, metadata);
    receiver.on('progress', function (bytesReceived) {
      console.log('receive progress', bytesReceived, 'out of', metadata.size);
    });
    // get notified when file is done
    receiver.on('receivedFile', function (file, metadata) {
      console.log('received file', metadata.name, metadata.size);

      // close the channel
      receiver.channel.close();
    });
    filelist.appendChild(item);
  });



  fileinput.addEventListener('change', function() {
    fileinput.disabled = true;

    var file = fileinput.files[0];
    var sender = peer.sendFile(file);
  });
  }
