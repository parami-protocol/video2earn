import React, {useEffect, useState} from 'react'
import {stringify} from "querystring";

const ChatRoom: React.FC = () => {
  enum ChatState {
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

  const [countdownInSecs, setCountdownInSecs] = useState(5);
  const [chatState, setChatState] = useState(ChatState.matching);

  const [rate, setRate] = useState({rate: ChatRate.good, rated: false, showRate: false})

  function rateUser(rate: ChatRate) {
    setRate({rate: rate, rated: true, showRate: true})
  }

  function transitionToConnecting() {
    setChatState(ChatState.connecting);
    setCountdownInSecs(0);
  }

  function transitionToChatting() {
    setChatState(ChatState.chatting);
    setCountdownInSecs(300);
  }

  function transitionToDone() {
    setChatState(ChatState.done);
    setCountdownInSecs(0);
  }

  useEffect(() => {
    if (chatState != ChatState.matching) {
      return;
    }

    //TODO: impl matching requests
    setTimeout(() => {
      transitionToConnecting();
    }, 5000)
  }, [chatState])

  useEffect(() => {
    if (chatState != ChatState.connecting) {
      return;
    }

    //TODO: impl connecting requests
    setTimeout(() => {
      transitionToChatting()
    }, 1000)
  }, [chatState])

  useEffect(() => {
    if (chatState != ChatState.chatting) {
      return;
    }
    // suggest rating after 1 min
    setTimeout(() => {
      setRate(rate => {
        if (rate.rated) {
          return rate;
        } else {
          return {rate: rate.rate, showRate: true, rated: rate.rated}
        }
      })
    }, 60 * 1000)

    // end chat after 5 min
    setTimeout(() => {
      transitionToDone();
    }, 300 * 1000)
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
    content = <div>matching: {countdownInSecs} </div>
  }

  if (chatState == ChatState.connecting) {
    content = <div>connecting...</div>
  }

  if (chatState == ChatState.chatting) {
    content = (<div>{countdownInSecs}- chatting,
      <p>{stringify(rate)}</p>
      <button onClick={() => rateUser(ChatRate.good)}>Good</button>
      <button onClick={() => rateUser(ChatRate.bad)}>Bad</button>
    </div>)
  }

  if (chatState == ChatState.done) {
    content = <div>{countdownInSecs} done</div>
  }

  if (chatState == ChatState.failed) {
    content = <div>failed</div>
  }

  return (<div>
    {content}
    <div>
      place holder: [self camera]
    </div>
  </div>)
}

export default ChatRoom;
