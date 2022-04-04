// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Coin.sol";

contract Video2Earn is ERC721Enumerable {
    using Counters for Counters.Counter;

    enum Intrest {
        Bussiness,
        Social
    }

    enum SessionState {
        Empty,
        Preparing,
        Ongoing
    }

    enum Rate {
        Good,
        Bad
    }

    struct NftInfo {
        uint32 value;
        Intrest intrest;
    }

    struct ChatSession {
        address receiver;
        uint32 startTime;
        uint32 nftId;
        Intrest intrest;
        SessionState state;
    }

    constructor() ERC721("video2earn-nft", "VENFT") {}

    address payable reserved;

    uint32 rewardCoinNum;
    uint32 nftInitialValue;
    uint256 nftMintFee;
    uint256 nftRepairFee;

    mapping (address => ChatSession) chatSessions;
    mapping (uint256 => NftInfo) nfts;

    Counters.Counter private _tokenIds;

    /********************************************************************************/
    /* Prepare a chat session for sender, the chat will not start unless both party */
    /* of the chat prepared a chat successfuly.                                     */
    /*                                                                              */
    /* throw errors if:                                                             */
    /* 1. sender does't own the specified nft id. Or                                */
    /* 2. sender prepared a session already. Or                                     */
    /* 3. the "to" user prepared a session in which "to" user is not the sender.    */
    /********************************************************************************/
    function prepareChatSession(address to, uint256 tokenId, Intrest intrest) external returns (SessionState) {
        require(ownerOf(tokenId) == msg.sender);

        NftInfo storage nft = nfts[tokenId];
        require(nft.intrest == intrest);
        require(nft.value >= 1);
        nft.value--;

        ChatSession memory session = chatSessions[msg.sender];
        require(session.state == SessionState.Empty);

        ChatSession storage toSession = chatSessions[to];
        require(toSession.state == SessionState.Empty ||
                toSession.state == SessionState.Preparing
                  && toSession.receiver == msg.sender
                  && toSession.intrest == intrest);

        if (toSession.state == SessionState.Empty) {
            chatSessions[msg.sender]= ChatSession(to, 0, uint32(tokenId), intrest, SessionState.Preparing);
            return SessionState.Preparing;
        }

        if (toSession.state == SessionState.Preparing) {
            uint32 startTime = uint32(block.timestamp);
            chatSessions[msg.sender] = ChatSession(to, startTime, uint32(tokenId), intrest, SessionState.Ongoing);
            toSession.state = SessionState.Ongoing;
            toSession.startTime = startTime;
            return SessionState.Ongoing;
        }

        assert(false);
        // should never be here
        // make the compiler happy;
        return SessionState.Empty;
    }

    /**************************************************************************/
    /* End chat sesion for sender:                                            */
    /*                                                                        */
    /* 1. If the chat session didn't start, remove the session                */
    /*       without decresing the nft value.                                 */
    /* 2. If the chat started, remove the session and decrease the nft value. */
    /*       Reward the target user if the rate is good.                      */
    /*                                                                        */
    /* throw errors if:                                                       */
    /* 1. sender doesn't have a session.                                    */
    /**************************************************************************/
    function endChatSession(Rate rate) external {
        ChatSession storage session = chatSessions[msg.sender];
        require(session.state != SessionState.Empty);

        session.state = SessionState.Empty;

        if (session.state == SessionState.Preparing) {
            // return the nft value since chat didn't start
            NftInfo storage nft = nfts[session.nftId];
            nft.value++;
            return;
        }

        if (session.state == SessionState.Ongoing) {
            if (rate == Rate.Good) {
                rewardUserCoin(session.receiver, rewardCoinNum);
            }
        }

    }

    function rewardUserCoin(address user, uint256 numCoin) private {

    }

    function mint(Intrest intrest) external payable {
        require(msg.value >= nftMintFee);

        // refund if value exceeds mint fee
        if (nftMintFee < msg.value) {
            payable(msg.sender).transfer(msg.value - nftMintFee);
        }

        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        _mint(msg.sender, tokenId);
        nfts[tokenId] = NftInfo(nftInitialValue, intrest);
    }

    function repairNft(uint256 nftId) external {
    }

}
