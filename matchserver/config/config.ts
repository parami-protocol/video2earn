export const zegoAppId = 573234333;
export const zegoServerSecret = process.env.ZEGO_SERVER_SECRET;

if (!zegoServerSecret) {
    throw Error("zego server secret unset");
}

