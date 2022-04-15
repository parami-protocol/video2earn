import React, { useEffect, useRef, useState } from 'react';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
import { useModel } from '@@/plugin-model/useModel';
import { requestSession } from '@/services/chat';
import { useParams } from 'umi';
import { OnChainERC20Widget, OnChainERC721Widget } from '@/pages/chat/OnChainAssetWidget';
import style from './index.less';
import { Rate, RateWidget } from '@/pages/chat/RateWidget';

const zgEngine = new ZegoExpressEngine(573234333, 'wss://webliveroom573234333-api.imzego.com/ws');

const user1Config = {
  token:
    '03AAAAAGJacbAAEGEyajU5OHp3MXVucXZkNDQAoHKSEwPXTkpuS7CglJoz1D7TtoaL8h3Ro8ZVeCgeSPr1m8iwIbBoRTWcgbq3dvdPKXInZDwWY18uyROK2KLITDpgbL0Ynj9X19a8grNfe+NX3HHWoPQJ1K4GZkFmXDUQ4MyenAV51w8OT0je09odCZsR+aSIHQfkcF5qvYDwUGuY2EKBpySk8sG2NAX4ssyOejq+jTgE6YinqbiE4lKkeZg=',
  user: { userID: 'user1' },
};

const user2Config = {
  token:
    '03AAAAAGJacc8AEGRlYnJwemh1ZGJpMGJqbmEAoHDQ+k76LqCoF5AcgeCbyImT78MCOW5JbjmdxtqT6EWv252Dd6zth489RW7qnJTIoXRGj3+gMthRsEnEgasICg/bLMI5ka37CrsbAjJTodWEwqFVXL+uRknYUhRUkqjzuzZZqWBqfDLoBn7sFRc4jWgbCx08g7AK+ECGsCQm9FFYanUoiPlZyL5yWWZevvN7n9rmTKAjBodw9GM22Ck5oCs=',
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

interface ChatSession {
  token: string;
  userId: string;
  roomId: string;
  userName?: string;
  peerAccount: string;
  peerUserId: string;
  peerUserName?: string;
}

interface VideoStreamState {
  remoteStream?: MediaStream;
  localStream?: MediaStream;
  pushStreamReady?: boolean;
  pullStreamReady?: boolean;
}

interface RateInfo {
  showRate: boolean;
  rate?: Rate;
}

const LocalVideoWidget = ({ videoStream }: { videoStream?: MediaStream }) => {
  if (!videoStream) {
    return null;
  }

  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  return (
    <div className={style.local_video_card}>
      <video className={style.local_video} ref={localVideoRef} autoPlay muted playsInline />
    </div>
  );
};

const RemoteVideoWidget = ({ videoStream }: { videoStream?: MediaStream }) => {
  if (!videoStream) {
    return null;
  }

  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  return (
    <div className={style.remote_video_card}>
      <video className={style.remote_video} ref={remoteVideoRef} autoPlay muted playsInline />
    </div>
  );
};

const ChatRoom: React.FC = () => {
  //@ts-ignore
  const { V2EContract, Account } = useModel('V2EContract');

  const [countdownInSecs, setCountdownInSecs] = useState(0);
  const [chatState, setChatState] = useState(ChatState.preparing);
  const [chatSession, setChatSession] = useState<ChatSession>({
    token: '',
    userId: '',
    roomId: '',
    peerUserId: '',
    peerAccount: '',
  });

  const [rateInfo, setRateInfo] = useState<RateInfo>({ showRate: false });

  const streamState = useRef<VideoStreamState>({});

  const [failedReason, setFailedReason] = useState<string>('');

  const params = useParams<{ channel: string }>();

  useEffect(() => {
    if (
      streamState.current.localStream &&
      (chatState == ChatState.failed || chatState == ChatState.done)
    ) {
      zgEngine.destroyStream(streamState.current.localStream);
      console.log('stream destroyed');
    }
  }, [chatState]);

  function mockSession(user: any) {
    console.log('mock user is {}', user);
    setChatSession((session) => {
      return { ...session, userId: user.user.userID, roomId: '1', token: user.token };
    });
    transitionToConnecting();
  }

  function onRate(rate: Rate) {
    setRateInfo((rateInfo) => {
      return { ...rateInfo, rate: rate };
    });
    if (rate == Rate.BAD) {
      transitionToDone();
    }
  }

  function transitionToMatching() {
    setChatState(ChatState.matching);
    setCountdownInSecs(5);
  }

  function transitionToConnecting() {
    setChatState(ChatState.connecting);
    setCountdownInSecs(0);
    console.log('transition to connecting');
  }

  function tryTransitionToChatting() {
    if (!streamState.current.pushStreamReady || !streamState.current.pullStreamReady) {
      return;
    }
    setChatState(ChatState.chatting);
    setCountdownInSecs(300);
    console.log('transition to chatting');
  }

  function transitionToDone() {
    setChatState(ChatState.done);
    setCountdownInSecs(0);
  }

  function transitionToFailed(reason: Error & { msg?: string }) {
    setChatState(ChatState.failed);
    setFailedReason(reason.msg || reason.message);
  }

  // prepare and check states
  useEffect(() => {
    if (chatState != ChatState.preparing) {
      return;
    }
    // TODO: disable checks for testing.
    // if (!V2EContract || !Account) {
    //   transitionToFailed(new Error("no contract or account available"));
    //   return;
    // }
    //
    // if (!params.channel) {
    //   transitionToFailed(new Error("no channel selected"));
    //   return;
    // }

    const promises = [];
    if (!streamState.current.localStream) {
      zgEngine.setLogConfig({ logLevel: 'error' });
      promises.push(
        zgEngine.createStream().then((stream) => {
          streamState.current.localStream = stream;
        }),
      );
    }

    Promise.all(promises)
      .then(() => transitionToMatching())
      .catch((err) => transitionToFailed(err));
  }, [chatState]);

  useEffect(() => {
    if (chatState != ChatState.matching) {
      return;
    }
    requestSession(Account, params.channel, 5)
      .then((sessionResponse) => {
        console.log('session response');
        if (typeof sessionResponse != 'object') {
          throw new Error('response unknown');
        }
        const chatSession: ChatSession = {
          ...sessionResponse,
        };
        setChatSession(chatSession);
      })
      .catch((err) => {
        // transitionToFailed(err);
      });
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

    zgEngine
      .loginRoom(chatSession.roomId, chatSession.token, { userID: chatSession.userId })
      .catch((error) => {
        transitionToFailed(error);
      });

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
      setRateInfo({ showRate: true });
    }, 5 * 1000);

    // end chat after 5 min
    const endChatTimeout = setTimeout(() => {
      transitionToDone();
    }, 300 * 1000);

    zgEngine.on('roomStreamUpdate', async (roomID, updateType, streamList, extendedData) => {
      if (updateType == 'DELETE' && streamState.current.remoteStream) {
        //@ts-ignore
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
        <div>
          mocked:
          <button onClick={() => mockSession(user1Config)}>user1</button>
          <button onClick={() => mockSession(user2Config)}>user2</button>
        </div>
        <div className={style.matching_container}>
          <div className={style.matching_text}>MATCHING...</div>
          <div className={style.matching_countdown}>{countdownInSecs}</div>
        </div>
        <LocalVideoWidget videoStream={streamState.current.localStream} />
      </div>
    );
  }

  if (chatState == ChatState.connecting) {
    content = (
      <div>
        <p> connecting </p>
        <LocalVideoWidget videoStream={streamState.current.localStream} />
      </div>
    );
  }

  if (chatState == ChatState.chatting) {
    content = (
      <>
        <div className={style.theme_root}>
          <div className={style.room_root}>
            <div className={style.room_user_card}>
              <RemoteVideoWidget videoStream={streamState.current.remoteStream} />
              <LocalVideoWidget videoStream={streamState.current.localStream} />
            </div>
            <div className={style.toolbar_root}>
              <div className={style.toolbar_column_center}>
                <img src="./imgs/cameraOff.png" className={style.toolbar_button} />
                <p className={style.toolbar_button_bottom_text}>Camera</p>
              </div>
              <div className={style.toolbar_column_center}>
                <img src="./imgs/micOff.png" className={style.toolbar_button} />
                <p className={style.toolbar_button_bottom_text}>Microphone</p>
              </div>
            </div>
            <OnChainERC721Widget account={'0x8b684993d03cc484936cf3a688ddc9937244f1d3'} />
            <OnChainERC20Widget account={'0xd8da6bf26964af9d7eed9e03e53415d37aa96045'} />
            <RateWidget showRate={rateInfo.showRate} rate={rateInfo.rate} onRated={onRate} />
          </div>
        </div>
      </>
    );
  }

  if (chatState == ChatState.done) {
    content = <div>done</div>;
  }

  if (chatState == ChatState.failed) {
    content = <div>failed: {failedReason} </div>;
  }

  return <div>{content}</div>;
};

export default ChatRoom;
