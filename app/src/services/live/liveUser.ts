import React from 'react'
class LiveUser extends React.Component<any> {
    constructor(props: any) {
        super(props);
        this.state = {
            userId: props.userId,
            roomId: props.roomId,
            token: props.token,
            streamId: props.userId + '_' + new Date().getTime(),
            zg: null,
            localStream: null,
            remoteStream: null,
            isLogin: false
        }

        this.createZegoExpressEngineOption = this.createZegoExpressEngineOption.bind(this)
        this.CheckSystemRequire = this.CheckSystemRequire.bind(this)
        this.loginRoom = this.loginRoom.bind(this)
        this.startPublishing = this.startPublishing.bind(this)
        this.startPlaying = this.startPlaying.bind(this)
        this.reset = this.reset.bind(this)
    }

    // Step1: create zg and initEvent
    createZegoExpressEngineOption() {
        // TODO(wangjw): 待实现
    }

    // Step2: check env
    async CheckSystemRequire() {
        // TODO(wangjw): 待实现
    }

    // Step3: login room
    async loginRoom() {
        // TODO(wangjw): 待实现
    }

    // Step4: publish stream
    async startPublishing() {
        // TODO(wangjw): 待实现
    }

    // Step5: play stream
    async startPlaying() {
        // TODO(wangjw): 待实现
    }

    // Step6: reset resource
    async reset() {
    }
}