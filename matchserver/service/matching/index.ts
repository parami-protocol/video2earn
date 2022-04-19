import {generateToken04} from "../zego/zegoServerAssistant";
import {zegoAppId, zegoServerSecret} from "../../config/config";

export interface User {
    account: string
}

export type OnMatchFunction = (roomId: string, tokenId: string, peerAccount: string) => void;
export type OnErrorFunction = (err: Error) => void;

export type callback = { onMatch: OnMatchFunction, onError: OnErrorFunction, channel: string };

function generateToken(userId: string): string {
    return generateToken04(zegoAppId, userId, zegoServerSecret!, 300000);
}

function uuid() {
    const chars = '0123456789abcdef'.split('');

    const uuid = [], rnd = Math.random;
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4'; // version 4

    let r = 0;

    for (let i = 0; i < 36; i++) {
        if (!uuid[i]) {
            r = 0 | rnd() * 16;

            uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
        }
    }

    return uuid.join('');
}

class MatchingRegistry {

    private channel2User: { [channel: string]: User[] } = {};

    private account2Callback:
        { [account: string]: callback } = {};

    public register(user: User,
                    channel: string,
                    onMatch: OnMatchFunction,
                    onError: OnErrorFunction): void {
        console.log("before register", user, channel, this.channel2User, this.account2Callback);
        if (Object.prototype.hasOwnProperty.call(this.account2Callback, user.account)) {
            this.account2Callback[user.account].onError(Error("there exists another matching session."));
        }

        const pendingUsers: User[] = this.channel2User[channel] || [];

        if (pendingUsers.length === 0) {
            this.account2Callback[user.account] = {onMatch, onError, channel};
            pendingUsers.push(user);
            this.channel2User[channel] = pendingUsers;
            console.log("after register without match", user, channel, this.channel2User, this.account2Callback);
            return;
        }

        const matchedUser = pendingUsers.pop();
        const callback = this.account2Callback[matchedUser!.account];
        delete this.account2Callback[matchedUser!.account];

        const roomId = uuid();
        onMatch(roomId, generateToken(user.account), matchedUser!.account);
        callback.onMatch(roomId, generateToken(matchedUser!.account), user.account);
        console.log("after register with match", roomId, user, channel, this.channel2User, this.account2Callback);
    }

    public unregister(user: User): void {
        console.log(`before unregister ${user} ${this.channel2User} ${this.account2Callback}`);
        const callback = this.account2Callback[user.account];
        delete this.account2Callback[user.account];

        this.channel2User[callback.channel] =
            this.channel2User[callback.channel].filter(
                (item) => item.account != user.account);

        console.log(`after unregister ${user} ${this.channel2User} ${this.account2Callback}`);
    }
}

export const registry = new MatchingRegistry();