// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract Nft is ERC721Enumerable {

    uint256 nftMintFee;
    address payable reserved;

    mapping (uint256 => NftInfo) nfts;

    struct NftInfo {
        uint32 value;
        Intrest intrest;
    }

    constructor() ERC721("video2earn-nft", "VENFT") {
    }

    function buyNft(Intrest intrest) external payable {
    }
}

enum Intrest {
    Bussiness,
    Social
}
