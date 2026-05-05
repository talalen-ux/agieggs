// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AGI — fixed-supply utility token for AGI.Pets.
/// @notice 100,000,000 hard cap. No inflation. Buy/sell tax routes to the
///         compute treasury that pays for inference and GPU work.
contract AGIToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 ether;
    uint16 public constant TAX_BPS = 250; // 2.5%

    address public computeTreasury;
    mapping(address => bool) public isPair; // DEX pair routers
    mapping(address => bool) public isExempt; // treasury, vault, etc.

    event ComputeTreasuryUpdated(address indexed treasury);
    event PairFlagged(address indexed pair, bool flagged);

    constructor(address _treasury) ERC20("AGI", "AGI") Ownable(msg.sender) {
        _mint(msg.sender, MAX_SUPPLY);
        computeTreasury = _treasury;
        isExempt[_treasury] = true;
        isExempt[msg.sender] = true;
    }

    function setComputeTreasury(address t) external onlyOwner {
        computeTreasury = t;
        isExempt[t] = true;
        emit ComputeTreasuryUpdated(t);
    }

    function setPair(address pair, bool flag) external onlyOwner {
        isPair[pair] = flag;
        emit PairFlagged(pair, flag);
    }

    function setExempt(address a, bool flag) external onlyOwner {
        isExempt[a] = flag;
    }

    /// @dev Tax only applies to DEX-routed transfers. Wallet-to-wallet is free
    ///      so the egg vault can claim without leaking value.
    function _update(address from, address to, uint256 value) internal override {
        if (
            value == 0 ||
            isExempt[from] ||
            isExempt[to] ||
            (!isPair[from] && !isPair[to])
        ) {
            super._update(from, to, value);
            return;
        }
        uint256 tax = (value * TAX_BPS) / 10_000;
        super._update(from, computeTreasury, tax);
        super._update(from, to, value - tax);
    }
}
