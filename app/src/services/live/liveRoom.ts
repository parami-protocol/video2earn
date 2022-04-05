import React from 'react'
import ZegoExpressEngine from 'zego-express-engine-webrtc'

class LiveRoom extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            appId: 0,
            server: '',
            userId: '',
            userName: '',
            roomId: '',
            token: '',
            streamId: '',
            zg: null,
            localStream: null,
            remoteStream: null,
            isLogin: false,
            videoCodec: localStorage.getItem('VideoCodec') === 'H.264' ? 'H264' : 'VP8',

            audioDeviceList: [],
            videoDeviceList: [],
            microphoneDevicesVal: null,
            cameraDevicesVal: null
        }

        this.fetchRoomInfo = this.fetchRoomInfo.bind(this)
        this.startLiveRoom = this.startLiveRoom.bind(this)
        this.reset = this.reset.bind(this)
    }

    fetchRoomInfo() {
        // TODO(wangjw04): 待实现
    }

    startLiveRoom() {
        console.log('createLiveRoom start')
        const zg = new ZegoExpressEngine.ZegoExpressEngine(this.state.appId, this.state.server);
        const checkSystemResult = this.CheckSystemRequire()
        if(!checkSystemResult) {
            console.error('checkSystemResult=' + checkSystemResult);
            return false;
        }
        this.setState({
            zg: zg
        }, () => {
            this.initEvent();
        })
        this.loginRoom();
        if (!this.state.isLogin) {
            return false;
        }
        console.log('createLiveRoom start')
        return true;
    }

    async CheckSystemRequire() {
        if (!this.state.zg) {
            return false;
        }
        const result = await this.checkSystemRequirements();
        if (result) {
            this.enumDevices();
        }
        return result;
    }

    async loginRoom() {
        try {
            this.setState({
                isLogin: true
            })
            await this.state.zg.loginRoom(this.state.roomId, this.state.token, {
                userID: this.state.userId,
                userName: this.state.userName
            }, { userUpdate: true }).then((result: boolean) => {
                if (result) {
                    console.log("login success")
                }
            });
        } catch (err) {
            this.setState({
                isLogin: false
            })
            console.log(err);
        }
    }

    async startPublishing() {
        try {
            this.setState({
                // TODO(wangjw): 这里先默认音视频权限都是支持的，后续优化
                localStream: await this.state.zg.createStream({
                    camera: {
                        audioInput: this.state.microphoneDevicesVal,
                        videoInput: this.state.cameraDevicesVal,
                        video: true,
                        audio: true,
                    }
                }),
                streamId: this.state.userId + '_' + new Date().getTime()
            })
            this.state.zg.startPublishingStream(this.state.streamId, this.state.localStream, { videoCodec: this.state.videoCodec });
            // TODO(wangjw04): 把localStream显示在video组件中
            return true;
        } catch (err) {
            console.error('startPublishing error=' + err);
            return false;
        }
    }

    async startPlaying(streamId: any) {
        try {
            this.setState({
                remoteStream: await this.state.zg.startPlayingStream(streamId, {
                    video: true,
                    audio: true
                })
            })
            // TODO(wangjw04): 把remoteStream显示在video组件中
            return true;
        } catch (err) {
            return false;
        }
    }

    async reset() {
    }

    initEvent() {
        this.state.zg.on('roomStateUpdate', (roomId: any, state: any) => {
            if (state == 'CONNECTED') {
                console.log("connect success, roomId=" + roomId);
                this.startPublishing();
            }
            // TODO(wangjw): 异常状态处理
            if (state === 'DISCONNECTED' && !this.state.isLogin) {
                this.reset();
            }
            if (state === 'DISCONNECTED' && this.state.isLogin) {
                location.reload()
            }
        })

        this.state.zg.on('roomStreamUpdate', async (roomId: string, updateType: any, streamList: any, extendedData: any) => {
            if (updateType == 'ADD') {
                const streamID = streamList[0].streamID;
                this.startPlaying(streamID);
            } else if (updateType == 'DELETE') {
                const streamID = streamList[0].streamID;
                this.state.zg.stopPlayingStream(streamID)
            }
        });
    }

    async checkSystemRequirements() {
        console.log('sdk version is', this.state.zg.getVersion());
        try {
            const result = await this.state.zg.checkSystemRequirements();
            console.log('checkSystemRequirements ', result);
            if (!result.webRTC) {
                console.error('browser is not support webrtc!!');
                return false;
            } else if (!result.videoCodec.H264 && !result.videoCodec.VP8) {
                console.error('browser is not support H264 and VP8');
                return false;
            } else if (!result.camera && !result.microphones) {
                console.error('camera and microphones not allowed to use');
                return false;
            } else if (result.videoCodec.VP8) {
                if (!result.screenSharing) console.warn('browser is not support screenSharing');
            } else {
                console.log('not support VP8');
            }
            return true;
        } catch (err) {
            console.error('checkSystemRequirements', err);
            return false;
        }
    }

    async enumDevices() {
        const deviceInfo = await this.state.zg.enumDevices();
        const audioDeviceList = deviceInfo &&
            deviceInfo.microphones.map((item: any, index: any) => {
                if (!item.deviceName) {
                    item.deviceName = 'microphone' + index;
                }
                console.log('microphone: ' + item.deviceName);
                return item;
            });
        audioDeviceList.push({ deviceID: 0, deviceName: '禁止' });
        const videoDeviceList = deviceInfo &&
            deviceInfo.cameras.map((item: any, index: any) => {
                if (!item.deviceName) {
                    item.deviceName = 'camera' + index;
                }
                console.log('camera: ' + item.deviceName);
                return item;
            });
        videoDeviceList.push({ deviceID: 0, deviceName: '禁止' });
        this.setState({
            videoDeviceList,
            audioDeviceList,
            microphoneDevicesVal: audioDeviceList[0].deviceID,
            cameraDevicesVal: videoDeviceList[0].deviceID
        })
    }
}