import express from "express";
import {registry} from "../service/matching";
import {clearTimeout} from "timers";

const router = express.Router();

router.post('/sessions', function (req, res, next) {
    console.log("hello")
    const query = req.query;

    const channel = query.channel as string;
    const account = query.account as string;

    if (!channel || !account) {
        res.status(400);
        res.end("channel or account not defined");
        return;
    }

    const timeoutInMillis = Math.min(
        parseInt(query.timeout as string, 10) || 30000,
        30000);

    console.log(`matching session, channel = ${channel}, account = ${account}, timeout = ${timeoutInMillis}`);
    const user = {account}
    const timeout = setTimeout(() => {
            console.log("timeout clean user", user);
            registry.unregister(user);
            res.status(200);
            res.json({result: "none"})
        }, timeoutInMillis
    )

    res.on('close', function () {
        console.log("connection closed early, clean timeout");
        clearTimeout(timeout);
        registry.unregister(user);
    })

    registry.register(user, channel,
        (roomId, tokenId, peerAccount) => {
            clearTimeout(timeout);
            res.status(200);
            res.json({
                roomId: roomId,
                token: tokenId,
                userId: account,
                peerAccount: peerAccount,
                peerUserId: peerAccount,
            })
        },
        (error) => {
            clearTimeout(timeout);
            registry.unregister(user);
            res.status(500);
            console.error(error)
            res.end(error.message);
        });

});

export default router;