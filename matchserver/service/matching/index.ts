
export interface User {
    account: string
}

export type OnMatchFunction = (roomId: string, tokenId: string, peerAccount: string) => void;
export type OnErrorFunction = (err: Error) => void;

export type callback = { onMatch: OnMatchFunction, onError: OnErrorFunction, channel: string };

function generateToken(): string {
    // import Zego token generation
    return "";
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
        if (Object.prototype.hasOwnProperty.call(this.account2Callback, user.account)) {
            onError(Error("there exists another matching session."));
            return;
        }

        const pendingUsers: User[] = this.channel2User[channel] || [];

        if (pendingUsers.length === 0) {
            this.account2Callback[user.account] = {onMatch, onError, channel};
            pendingUsers.push(user);
            this.channel2User[channel] = pendingUsers;
            return;
        }

        const matchedUser = pendingUsers.pop();
        const callback = this.account2Callback[matchedUser!.account];
        delete this.account2Callback[matchedUser!.account];

        const token = generateToken();
        const roomId = uuid();
        onMatch(roomId, token, matchedUser!.account);
        callback.onMatch(roomId, token, user.account);
    }

    public unregister(user: User): void {
        const callback = this.account2Callback[user.account];
        delete this.account2Callback[user.account];

        this.channel2User[callback.channel] =
            this.channel2User[callback.channel].filter(
                (item) => item.account != user.account);
    }
}

export const registry = new MatchingRegistry();