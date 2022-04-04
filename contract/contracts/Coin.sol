// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Coin is ERC20, Ownable {

    address ownerContract;

    mapping(address => uint32) pendingMintCoins;

    modifier onlyContract() {
        require(msg.sender == ownerContract);
        _;
    }

    constructor() ERC20("video2earn-coin", "V2EC") {
    }

    function pendMintCoins(address account, uint256 amount) public onlyContract {
        pendingMintCoins[account] += amount;
    }

    function burn(address account, uint256 amount) public onlyContract {
        _burn(account, amount);
    }

    function withdraw() public {
        uint256 coins = pendingWithdraws[msg.sender];
        pendingWithdraws[msg.sender] = 0;
        _mint(msg.sender, coins);
    }

    function setOwnerContract(address contractAddr) public onlyOwner {
        ownerContract = contractAddr;
    }
}
