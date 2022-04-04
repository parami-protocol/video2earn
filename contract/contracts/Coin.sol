// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Coin is ERC20, Ownable {

    address ownerContract;

    modifier onlyContract() {
        require(msg.sender == ownerContract);
        _;
    }

    constructor() ERC20("video2earn-coin", "V2EC") {
    }

    function mint(address account, uint256 amount) public onlyContract {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public onlyContract {
        _burn(account, amount);
    }

    function setContractAddress(address addr) public onlyOwner {
        ownerContract = addr;
    }
}
