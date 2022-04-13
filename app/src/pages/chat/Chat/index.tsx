import React, { useEffect, useRef, useState } from 'react';
import { stringify } from 'querystring';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
import style from './index.less';

const zgEngine = new ZegoExpressEngine(573234333, 'wss://webliveroom573234333-api.imzego.com/ws');

const user1Config = {
  token:
    '03AAAAAGJXwPoAEHp6cjE5eTI3cm94Y3hoZjgAoHGsK9co7SsgozK0M8aZEcuL21wnDPhQnPfpG17j4xvC4HglNr6xMQZ7k/FwwujXobVzQRuoHRt+AoIlbK8oinVGoYBi9G/zLnZ1Mq6nUsWctSQe2i3/WOK7R7slaRD9AYX6YM1pT7bR+ehVoonj5FD0bY/ouKHf1C7DPC0EUryFM4ANYq7P8nHr7dKp31uVNjl9Q273AeUX+Hbuayb5mb0=',
  user: { userID: 'user1' },
};
const user2Config = {
  token:
    '03AAAAAGJXwSIAEGlweWRrMGRkMnV0dnFnanEAoAGZkFYFrxB/ercAOAsxGqciOGGE7YKw9+p//JyMWS+xT4/f6QZDVqg3s5/brmlYUMfNgsy67qrzNkZcWe66sB7GUal33cmdNpLTcyNvF86nuW5xJtqJeh7gFEE35wnoq0SJ1dK28J46JJI8ljVSTaKKs2flWynapFeZ59cRgiumKQlPUUV4UbbKyoJge1ANn9pE2bUwC8cYlzy1lZYlyLg=',
  user: { userID: 'user2' },
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
  token: string;
  userId: string;
  roomId: string;
  userName?: string;
}

interface VideoStreamState {
  remoteStream?: MediaStream;
  localStream?: MediaStream;
  session?: ChatSession;
  pushStreamReady?: boolean;
  pullStreamReady?: boolean;
}

interface RateInfo {
  rate: ChatRate;
  rated: boolean;
  showRate: boolean;
}

const ChatRoom: React.FC = () => {
  const [countdownInSecs, setCountdownInSecs] = useState(0);
  const [chatState, setChatState] = useState(ChatState.preparing);

  const [rate, setRate] = useState<RateInfo>({
    rate: ChatRate.good,
    rated: false,
    showRate: false,
  });
  const streamState = useRef<VideoStreamState>({});

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [failedReason, setFailedReason] = useState<string>('');

  useEffect(() => {
    if (!streamState.current.localStream) {
      zgEngine.setLogConfig({ logLevel: 'error' });
      zgEngine
        .createStream()
        .then((stream) => {
          streamState.current.localStream = stream;
          setChatState(ChatState.matching);
          setCountdownInSecs(5);
        })
        .catch((reason) => {
          transitionToFailed(reason);
        });
    }
    if (
      streamState.current.localStream &&
      (chatState == ChatState.failed || chatState == ChatState.done)
    ) {
      zgEngine.destroyStream(streamState.current.localStream);
    }
  }, [chatState]);

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
      );
    }

    return <div> rate: {rate.rate == 0 ? 'Good' : 'Bad'} </div>;
  }

  useEffect(() => {
    if (localVideoRef.current != null && streamState.current.localStream != null) {
      localVideoRef.current.srcObject = streamState.current.localStream;
    }
    if (remoteVideoRef.current != null && streamState.current.remoteStream != null) {
      remoteVideoRef.current.srcObject = streamState.current.remoteStream;
    }
  }, [chatState]);

  function requestSession(user: any) {
    streamState.current.session = { userId: user.user.userID, token: user.token, roomId: '1' };
    transitionToConnecting();
  }

  function rateUser(rate: ChatRate) {
    setRate({ rate: rate, rated: true, showRate: true });
    if (rate == ChatRate.bad) {
      transitionToDone();
    }
  }

  function transitionToConnecting() {
    setChatState(ChatState.connecting);
    setCountdownInSecs(0);
  }

  function tryTransitionToChatting() {
    if (!streamState.current.pushStreamReady || !streamState.current.pullStreamReady) {
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
  }, [chatState]);

  useEffect(() => {
    if (chatState != ChatState.connecting) {
      return;
    }
    zgEngine.on('roomStateUpdate', async (roomId, state, errorCode, extendedData) => {
      if (state == 'CONNECTED') {
        let streamID = new Date().getTime().toString();
        if (!streamState.current.localStream) {
          throw new Error('local stream not found');
        }
        zgEngine.startPublishingStream(streamID, streamState.current.localStream);
        streamState.current.pushStreamReady = true;
        tryTransitionToChatting();
      }
    });
    zgEngine.on('roomStreamUpdate', async (roomID, updateType, streamList, extendedData) => {
      if (updateType == 'ADD') {
        const streamID = streamList[0].streamID;
        streamState.current.remoteStream = await zgEngine.startPlayingStream(streamID);
        streamState.current.pullStreamReady = true;
        tryTransitionToChatting();
      }
    });

    if (!streamState.current.session) {
      throw Error('no sessions available');
    }

    const session = streamState.current.session;

    zgEngine.loginRoom(session.roomId, session.token, { userID: session.userId });

    return () => {
      zgEngine.off('roomStateUpdate');
      zgEngine.off('roomStreamUpdate');
    };
  }, [chatState]);

  useEffect(() => {
    if (chatState != ChatState.chatting) {
      return;
    }
    // show rating after 1 min
    const showRateTimeout = setTimeout(() => {
      setRate((rate) => {
        return { rate: rate.rate, showRate: true, rated: rate.rated };
      });
    }, 5 * 1000);

    // end chat after 5 min
    const endChatTimeout = setTimeout(() => {
      transitionToDone();
    }, 300 * 1000);

    zgEngine.on('roomStreamUpdate', async (roomID, updateType, streamList, extendedData) => {
      if (updateType == 'DELETE' && streamState.current.remoteStream) {
        const streamId = streamState.current.remoteStream.streamId;
        zgEngine.stopPlayingStream(streamId);
        transitionToDone();
      }
    });

    return () => {
      clearTimeout(showRateTimeout);
      clearTimeout(endChatTimeout);
      zgEngine.off('roomStreamUpdate');
      zgEngine.logoutRoom('1');
    };
  }, [chatState]);

  useEffect(() => {
    // count down every second
    let interval = setInterval(() => {
      setCountdownInSecs((countdownInSecs) => (countdownInSecs > 0 ? countdownInSecs - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdownInSecs]);

  let content = <div>unexpected state</div>;

  if (chatState == ChatState.matching) {
    content = (
      <div>
        matching: {countdownInSecs}
        <button onClick={() => requestSession(user1Config)}>user1</button>
        <button onClick={() => requestSession(user2Config)}>user2</button>
        <video ref={localVideoRef} autoPlay playsInline />
      </div>
    );
  }

  if (chatState == ChatState.connecting) {
    content = (
      <div>
        <p> connecting </p>
        <video ref={localVideoRef} autoPlay playsInline />
      </div>
    );
  }

  if (chatState == ChatState.chatting) {
    content = (
      <>
        <div>
          {countdownInSecs}- chatting,
          <p>{stringify(rate)}</p>
        </div>
        <div className={style.theme_root}>
          <div className={style.room_root}>
            <div className={style.room_user_card}>
              <div className={style.remote_video_card}>
                <video
                  className={style.remote_video}
                  ref={remoteVideoRef}
                  autoPlay
                  muted
                  playsInline
                />
                <div className={style.remote_card_wrapper} />
              </div>
              <div className={style.local_video_card}>
                <video
                  className={style.local_video}
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                />
                <div className={style.local_card_wrapper} />
              </div>
            </div>
            <div height="54px">
              <div className={style.toolbar_root}>
                <div className={style.toolbar_left_side}>
                  <div className={style.toolbar_column_center}>
                    <img src="./imgs/cameraOff.png" className={style.toolbar_button} />
                    <p className={style.toolbar_button_bottom_text}>Camera</p>
                  </div>
                  <div className={style.toolbar_column_center}>
                    <img src="./imgs/micOff.png" className={style.toolbar_button} />
                    <p className={style.toolbar_button_bottom_text}>Microphone</p>
                  </div>
                </div>
              </div>
            </div>
            <RateComponent rate={rate} />
          </div>
        </div>
      </>
    );
  }

  if (chatState == ChatState.done) {
    content = (
      <div>
        <RateComponent rate={rate} />
      </div>
    );
  }

  if (chatState == ChatState.failed) {
    content = <div>failed: {failedReason} </div>;
  }

  return <div>{content}</div>;
};

export default ChatRoom;
