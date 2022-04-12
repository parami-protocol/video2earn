import React, {useEffect, useRef, useState} from 'react'
import {stringify} from "querystring";
import {ZegoExpressEngine} from "zego-express-engine-webrtc";

const zgEngine =
  new ZegoExpressEngine(573234333, "wss://webliveroom573234333-api.imzego.com/ws")


const user1Config = {
  token: "03AAAAAGJWQ94AEDNsbGMzM3Z1cm02aTltcDMAoFNdp4iX+IYwCDCcXHA3zWJMj7dOLlM1xtFzs/70QsMOn1G9qwvHN2bbkdtsB4CtSdA6IZrVMu1YmMZXyoMfTS/PFcHMCtY5PQHm0HtJq5YutdeOeZKimGapBELlKglUpjUWyV2On1HIMtVKDEJ762eHX4QNN2HT8Ofq3u5qHc4Gm2IOd5qEH3JeWUTvBV+6U4lDYxRJhxSie9J1NUqe/e4=",
  user: {"userID": "user1"}
};
const user2Config = {
  token: "03AAAAAGJWRqUAEHJmMXJycWx4cjlhZTZ3NnQAoECttj8Rg4S1Q0gN2tZmeVrp/LNlRROPpYfN065PCA8O3PizQjsbP1qsBzziZXyAFDdc8VqwoLHvtwIvW/hgp7I00As9S8HizTuTjguAKibPe5m2QcO8u98RX4Kn+Gvl5WLRmPJkrmDqL/l2JNbFg93ODkl/7lsP1p5j7Bg+XrA1TQOPGEPyfFmDw0ipfi0D+Ec2A11Px2GLsAX9O7T2ln0=",
  user: {"userID": "user2"}
};

enum ChatState {
  preparing,
  matching,
  connecting,
  chatting,
  done,
  failed,
}

enum ChatRate {
  good,
  bad,
}

interface ChatSession {
  token: string,
  userId: string,
  roomId: string,
  userName?: string,
}

interface VideoStreamState {
  remoteStream?: MediaStream,
  localStream?: MediaStream,
  session?: ChatSession,
  pushStreamReady?: boolean,
  pullStreamReady?: boolean,
}

interface RateInfo {
  rate: ChatRate,
  rated: boolean,
  showRate: boolean
}

const ChatRoom: React.FC = () => {

  const [countdownInSecs, setCountdownInSecs] = useState(0);
  const [chatState, setChatState] = useState(ChatState.preparing);

  const [rate, setRate] = useState<RateInfo>({rate: ChatRate.good, rated: false, showRate: false})
  const streamState = useRef<VideoStreamState>({})

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [failedReason, setFailedReason] = useState<string>("");

  useEffect(() => {
    if (!streamState.current.localStream) {
      zgEngine.setLogConfig({logLevel: "error"});
      zgEngine.createStream().then((stream) => {
        streamState.current.localStream = stream;
        setChatState(ChatState.matching);
        setCountdownInSecs(5);
      }).catch(reason => {
        transitionToFailed(reason);
      })
    }
    if (streamState.current.localStream && (chatState == ChatState.failed || chatState == ChatState.done)) {
      zgEngine.destroyStream(streamState.current.localStream);
    }
  }, [chatState])


  function RateComponent(prop: any) {
    const rate = prop.rate;
    if (!rate.showRate) {
      return null;
    }

    if (!rate.rated) {
      return (
        <div>
          <button onClick={() => rateUser(ChatRate.good)}>Good</button>
          <button onClick={() => rateUser(ChatRate.bad)}>Bad</button>
        </div>
      )
    }

    return (<div> rate: {rate.rate == 0 ? "Good" : "Bad" } </div>)
  }

  useEffect(() => {
    if (localVideoRef.current != null && streamState.current.localStream != null) {
      localVideoRef.current.srcObject = streamState.current.localStream;
    }
    if (remoteVideoRef.current != null && streamState.current.remoteStream != null) {
      remoteVideoRef.current.srcObject = streamState.current.remoteStream;
    }
  }, [chatState])

  function requestSession(user: any) {
    streamState.current.session = {userId: user.user.userID, token: user.token, roomId: "1"}
    transitionToConnecting();
  }

  function rateUser(rate: ChatRate) {
    setRate({rate: rate, rated: true, showRate: true})
    if (rate == ChatRate.bad) {
      transitionToDone();
    }
  }

  function transitionToConnecting() {
    setChatState(ChatState.connecting);
    setCountdownInSecs(0);
  }

  function tryTransitionToChatting() {
    if (!streamState.current.pushStreamReady
      || !streamState.current.pullStreamReady) {
      return;
    }
    setChatState(ChatState.chatting);
    setCountdownInSecs(300);
  }

  function transitionToDone() {
    setChatState(ChatState.done);
    setCountdownInSecs(0);
  }

  function transitionToFailed(reason: Error) {
    setChatState(ChatState.failed);
    setFailedReason(reason.toString());
  }

  useEffect(() => {
    if (chatState != ChatState.matching) {
      return;
    }
  }, [chatState])

  useEffect(() => {
    if (chatState != ChatState.connecting) {
      return;
    }
    zgEngine.on("roomStateUpdate", async (roomId, state, errorCode, extendedData) => {
      if (state == 'CONNECTED') {
        let streamID = new Date().getTime().toString();
        if (!streamState.current.localStream) {
          throw new Error("local stream not found");
        }
        zgEngine.startPublishingStream(streamID, streamState.current.localStream);
        streamState.current.pushStreamReady = true;
        tryTransitionToChatting();
      }
    })
    zgEngine.on('roomStreamUpdate', async (roomID, updateType, streamList, extendedData) => {
      if (updateType == 'ADD') {
        const streamID = streamList[0].streamID;
        streamState.current.remoteStream = await zgEngine.startPlayingStream(streamID);
        streamState.current.pullStreamReady = true;
        tryTransitionToChatting();
      }
    });

    if (!streamState.current.session) {
      throw Error("no sessions available");
    }

    const session = streamState.current.session;

    zgEngine.loginRoom(session.roomId,
      session.token,
      {userID: session.userId}
    )

    return () => {
      zgEngine.off('roomStateUpdate');
      zgEngine.off('roomStreamUpdate');
    }
  }, [chatState])

  useEffect(() => {
    if (chatState != ChatState.chatting) {
      return;
    }
    // show rating after 1 min
    const showRateTimeout = setTimeout(() => {
      setRate(rate => {
        return {rate: rate.rate, showRate: true, rated: rate.rated}
      })
    }, 5 * 1000)

    // end chat after 5 min
    const endChatTimeout = setTimeout(() => {
      transitionToDone();
    }, 300 * 1000)

    zgEngine.on('roomStreamUpdate', async (roomID, updateType, streamList, extendedData) => {
      if (updateType == 'DELETE' && streamState.current.remoteStream) {
        const streamId = streamState.current.remoteStream.streamId
        zgEngine.stopPlayingStream(streamId);
        transitionToDone();
      }
    });

    return () => {
      clearTimeout(showRateTimeout);
      clearTimeout(endChatTimeout);
      zgEngine.off('roomStreamUpdate');
      zgEngine.logoutRoom('1')
    }
  }, [chatState])

  useEffect(() => {
    // count down every second
    let interval = setInterval(() => {
      setCountdownInSecs(countdownInSecs => countdownInSecs > 0 ? countdownInSecs - 1 : 0);
    }, 1000)
    return () => clearInterval(interval);
  }, [countdownInSecs])

  let content = (<div>unexpected state</div>);

  if (chatState == ChatState.matching) {
    content = (<div>matching: {countdownInSecs}
      <button onClick={() =>  requestSession(user1Config)}>user1</button>
      <button onClick={() =>  requestSession(user2Config)}>user2</button>
      <video ref={localVideoRef} autoPlay playsInline/>
    </div>)
  }

  if (chatState == ChatState.connecting) {
    content = (<div>
      <p> connecting </p>
      <video ref={localVideoRef} autoPlay playsInline/>
    </div>)
  }

  if (chatState == ChatState.chatting) {
    content = (<div>{countdownInSecs}- chatting,
      <p>{stringify(rate)}</p>
      <video ref={remoteVideoRef} autoPlay playsInline/>
      <video ref={localVideoRef} autoPlay playsInline/>
      <RateComponent rate={rate}/>
    </div>)
  }

  if (chatState == ChatState.done) {
    content = <div><RateComponent rate={rate}/></div>
  }

  if (chatState == ChatState.failed) {
    content = <div>failed: {failedReason} </div>
  }

  return (<div>
    {content}
  </div>)
}

export default ChatRoom;
