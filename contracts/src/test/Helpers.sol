// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// Test-only helpers. Not part of the deployed system.

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IEgg {
    function mintWithETH(uint16 design, uint256 quantity) external payable;
}

/// A wallet contract that cannot receive ERC-721s.
contract NonReceiverWallet {
    function sendAGI(IERC20 token, address to, uint256 amount) external {
        token.transfer(to, amount);
    }

    function sendETH(address payable to) external payable {
        (bool ok, bytes memory data) = to.call{value: msg.value}("");
        if (!ok) assembly { revert(add(data, 32), mload(data)) }
    }

    receive() external payable {}
}

/// A receiver that tries to re-enter the egg contract during minting.
contract ReentrantReceiver is IERC721Receiver {
    IEgg public egg;
    bool public attempted;

    constructor(IEgg egg_) {
        egg = egg_;
    }

    function attack(uint16 design) external payable {
        egg.mintWithETH{value: msg.value}(design, 1);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        if (!attempted) {
            attempted = true;
            egg.mintWithETH{value: 0}(0, 1); // must revert (nonReentrant)
        }
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {}
}

/// A hook that returns the wrong selector.
contract BadHook {
    function onAGIReceived(address, uint256) external pure returns (bytes4) {
        return 0xdeadbeef;
    }
}
