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
     });
