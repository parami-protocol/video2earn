// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Coin.sol";

contract Video2Earn is ERC721Enumerable {
    using Counters for Counters.Counter;

    enum Intrest {
        None,
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
        uint256 value;
        Intrest intrest;
    }

    struct ChatSession {
        address receiver;
        uint256 startTime;
        uint256 nftId;
        Intrest intrest;
        SessionState state;
    }

    event ChatSessionStart(address indexed one, address indexed another);
    event ChatSessionEnd(address indexed one, address indexed another, Rate rate);

    constructor(address _coinContracts,
                uint256 _rewardCoinNum,
                uint256 _nftInitialValue,
                uint256 _nftMintFee,
                uint256 _nftRepairFee)
        ERC721("video2earn-nft", "VENFT") {
        rewardCoinNum = _rewardCoinNum;
        coinContracts = _coinContracts;
        nftInitialValue = _nftInitialValue;
        nftMintFee = _nftMintFee;
        nftRepairFee = _nftRepairFee;
    }

    address coinContracts;
    Coin coin;

    // coin num that should be rewarded when video chat rate is good.
    uint256 rewardCoinNum;
    // initial nft value after minted.
    uint256 nftInitialValue;
    // how much ether one should pay when mint a new nft
    uint256 nftMintFee;
    // how much coin one should pay when repair a nft
    uint256 nftRepairFee;

    mapping (address => ChatSession) chatSessions;
    mapping (uint256 => NftInfo) nfts;

    mapping (address => uint256) pendingWithdraws;

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
            chatSessions[msg.sender]= ChatSession(to, 0, tokenId, intrest, SessionState.Preparing);
            return SessionState.Preparing;
        }

        if (toSession.state == SessionState.Preparing) {
            uint256 startTime = block.timestamp;
            chatSessions[msg.sender] = ChatSession(to, startTime, tokenId, intrest, SessionState.Ongoing);
            toSession.state = SessionState.Ongoing;
            toSession.startTime = startTime;
            emit ChatSessionStart(msg.sender, to);
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


        if (session.state == SessionState.Preparing) {
            session.state = SessionState.Empty;

            // refund the nft value since chat didn't start
            NftInfo storage nft = nfts[session.nftId];
            nft.value++;
            return;
        }

        if (session.state == SessionState.Ongoing) {
            session.state = SessionState.Empty;

            if (rate == Rate.Good) {
                rewardUserCoin(session.receiver, rewardCoinNum);
            }
            emit ChatSessionEnd(msg.sender, session.receiver, rate);
        }

    }

    function rewardUserCoin(address user, uint256 numCoin) private {
        coin.pendWithdraws(user, numCoin);
    }

    function mint(Intrest intrest) external payable {
        require(msg.value >= nftMintFee);
        require(intrest != Intrest.None);

        // refund if value exceeds mint fee
        if (nftMintFee < msg.value) {
            pendingWithdraws[msg.sender] += msg.value - nftMintFee;
        }

        uint256 tokenId = totalSupply();
        _mint(msg.sender, tokenId);
        nfts[tokenId] = NftInfo(nftInitialValue, intrest);
    }

    function withdraw() public {
        uint256 refund = pendingWithdraws[msg.sender];
        pendingWithdraws[msg.sender] = 0;
        payable(msg.sender).transfer(refund);
    }

    function repairNft(uint256 nftId, uint256 increaseValue) external {
        uint256 requiredCoin = increaseValue * nftRepairFee;
        uint256 balance = coin.balanceOf(msg.sender);
        require(balance >= requiredCoin);

        NftInfo storage nft = nfts[nftId];
        require(nft.intrest != Intrest.None);

        coin.burn(msg.sender, requiredCoin);
        nft.value += increaseValue;
    }

    function pendingWithdrawOf(address owner) external view returns (uint256) {
        return pendingWithdraws[owner];
    }

    function nftInfoOf(uint256 tokenId) external view returns (NftInfo memory) {
        return nfts[tokenId];
    }

    function chatSessionOf(address owner) external view returns (ChatSession memory) {
        return chatSessions[owner];
    }
}
