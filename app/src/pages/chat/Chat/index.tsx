import React, { useEffect, useRef, useState } from 'react';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
import { useModel } from '@@/plugin-model/useModel';
import { requestSession } from '@/services/chat';
import { useHistory } from 'umi';
import { OnChainERC20Widget, OnChainERC721Widget } from '@/pages/chat/OnChainAssetWidget';
import style from './index.less';
import { Rate, RateWidget } from '@/pages/chat/RateWidget';
import { Button, message } from 'antd';

const zgEngine = new ZegoExpressEngine(573234333, 'wss://webliveroom573234333-api.imzego.com/ws');

// const user1Config = {
//   token:
//     '03AAAAAGJejs8AEGdsNGNubW42bmJkM3RzNjQAoI6M09ogWIqlCTBB/86KjXDmOEd8wJgWPboB542shOYZ0uqqRQY/JpS5lz8ZZ5W7URN3a4BIv94WUExV+AimuN6c/cUgzUG6J608QgDWGaRdskjenQAymFXLv+4qKbbHueQdJXHu2nKiofey+Zozke70MZhR5I3zaJUeCu8vQHNBQ5nVm2MoilZRPLAacOkJCjcKU4J9tPMYLthkZ+Bs7tU=',
//   user: { userID: 'user1' },
// };
//
// const user2Config = {
//   token:
//     '03AAAAAGJejuoAEHd0endqbmZyZGRhdHZzZTgAoI0taoAfOuaTddMCdc1eifHRonxvuF/FZ/bOBL/Zl2h1HqJNigllyi/FMeDHVwyC0biuzhIjBpQVY/v38qC3eIe3AsDjz9JSq9MBUFH27Vg57tVqW1sgDF5JvCviS5NgKt3uU3IyKPhJN82fyIy3nHiM9S7JmPbx5zS4HD5+28VyriDMqodyo9j3E8+0m3o+32e6fLwRI4Coi/AZUToTDuo=',
//   user: { userID: 'user2' },
// };

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
      <video className={style.remote_video} ref={remoteVideoRef} autoPlay playsInline />
    </div>
  );
};

const ChatRoom: React.FC = () => {
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

  const history = useHistory();
  const query = history.location['query'];

  useEffect(() => {
    if (
      streamState.current.localStream &&
      (chatState == ChatState.failed || chatState == ChatState.done)
    ) {
      zgEngine.destroyStream(streamState.current.localStream);
      console.log('stream destroyed');
    }

    if (chatState == ChatState.connecting || chatState == ChatState.chatting) {
      console.log('register room will expire callback');
      zgEngine.on('tokenWillExpire', async (roomID: string) => {
        console.log('room will expire');
        message.error('room will expire');
      });
    }
  }, [chatState]);

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
    setCountdownInSecs(30);
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

    if (!V2EContract || !Account) {
      transitionToFailed(new Error('no contract or account available'));
      return;
    }

    if (!query.channel) {
      transitionToFailed(new Error('no channel selected'));
      return;
    }

    const promises = [];
    // clear states
    streamState.current = {};
    zgEngine.setLogConfig({ logLevel: 'error' });
    promises.push(
      zgEngine.createStream().then((stream) => {
        streamState.current.localStream = stream;
      }),
    );

    Promise.all(promises)
      .then(() => transitionToMatching())
      .catch((err) => transitionToFailed(err));
  }, [chatState]);

  useEffect(() => {
    if (chatState != ChatState.matching) {
      return;
    }

    requestSession(Account, query.channel, 30)
      .then((sessionResponse) => {
        if (typeof sessionResponse != 'object') {
          throw new Error('response unknown');
        }
        if (sessionResponse.result == 'none') {
          transitionToFailed(Error('no matching'));
        }
        const chatSession: ChatSession = {
          ...sessionResponse,
        };
        setChatSession(chatSession);
        transitionToConnecting();
      })
      .catch((err) => {
        transitionToFailed(err);
      });
  }, [chatState]);

  useEffect(() => {
    if (chatState != ChatState.connecting) {
      return;
    }
    zgEngine.on('roomStateUpdate', async (roomId, state, errorCode, extendedData) => {
      console.log('roomStateUpdate', state, errorCode, extendedData);
      if (state == 'CONNECTED') {
        console.log('CONNECTED', roomId);
        let streamID = chatSession.userId + new Date().getTime().toString();
        if (!streamState.current.localStream) {
          throw new Error('local stream not found');
        }
        const result = zgEngine.startPublishingStream(streamID, streamState.current.localStream);
        if (!result) {
          transitionToFailed(Error('client publish stream error'));
          return;
        }
        console.log('start publish stream');
        streamState.current.pushStreamReady = true;
        tryTransitionToChatting();
      }
    });
    zgEngine.on('roomStreamUpdate', async (roomID, updateType, streamList, extendedData) => {
      console.log('roomStreamUpdate', updateType);
      if (updateType == 'ADD') {
        console.log('ADD', roomID, streamList);
        const streamID = streamList[0].streamID;
        streamState.current.remoteStream = await zgEngine.startPlayingStream(streamID);
        streamState.current.pullStreamReady = true;
        tryTransitionToChatting();
      }
    });

    console.log('chat session', chatSession);
    zgEngine
      .loginRoom(
        chatSession.roomId,
        chatSession.token,
        { userID: chatSession.userId },
        { userUpdate: true },
      )
      .catch((error) => {
        transitionToFailed(error);
      });

    return () => {
      console.log('deregister room event');
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
      console.log('roomStreamUpdate when chatting');
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
      zgEngine.logoutRoom(chatSession.roomId);
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
            <OnChainERC721Widget account={chatSession.peerAccount} />
            <OnChainERC20Widget account={chatSession.peerAccount} />
            <RateWidget showRate={rateInfo.showRate} rate={rateInfo.rate} onRated={onRate} />
          </div>
        </div>
      </>
    );
  }

  if (chatState == ChatState.done) {
    content = (
      <div>
        <Button
          onClick={() => {
            history.push('/');
          }}
        >
          Back To Home
        </Button>
        <Button
          onClick={() => {
            setChatState(ChatState.preparing);
          }}
        >
          Start Again{' '}
        </Button>
      </div>
    );
  }

  if (chatState == ChatState.failed) {
    content = <div>failed: {failedReason} </div>;
  }

  return <div>{content}</div>;
};

export default ChatRoom;
