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
    }

    constructor() ERC721("video2earn-nft", "VENFT") {}

    address payable reserved;

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
    function prepareChatSession(address to, uint256 nftId, Intrest intrest) external {
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
    /* 1. sender doesn't have a session. Or                                   */
    /* 2. the specified user doesn't belong to the sender's session.          */
    /**************************************************************************/
    function endChatSession(address to, Rate rate) external {
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
