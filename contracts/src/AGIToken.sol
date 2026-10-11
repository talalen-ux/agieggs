// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @notice Implemented by contracts that want to react when AGI is sent to
///         them with a plain `transfer` (e.g. from a wallet that never
///         connected to the site).
interface IAGIReceiver {
    function onAGIReceived(address from, uint256 amount) external returns (bytes4);
}

/// @title AGI — fixed-supply utility token for AGI.Pets.
/// @notice 100,000,000 AGI minted once at deployment; there is no mint
///         function, so supply can never grow. A fixed 2.5% tax applies only
///         to transfers that touch a registered DEX pair and is routed to the
///         compute treasury. The rate is a constant and cannot be changed.
contract AGIToken is ERC20, ERC20Permit, Ownable2Step {
    uint256 public constant MAX_SUPPLY = 100_000_000 ether;
    uint256 public constant TAX_BPS = 250; // 2.5%, immutable by design

    address public treasury;
    mapping(address => bool) public isPair;
    mapping(address => bool) public isTaxExempt;
    /// @notice Contracts notified via IAGIReceiver when they receive AGI.
    mapping(address => bool) public isReceiverHook;
    /// @notice Once true, the pair list can never change again, so the owner
    ///         cannot start taxing an ordinary wallet by flagging it as a pair.
    bool public pairsLocked;

    event TreasuryUpdated(address indexed treasury);
    event PairSet(address indexed pair, bool flagged);
    event TaxExemptSet(address indexed account, bool exempt);
    event ReceiverHookSet(address indexed receiver, bool enabled);
    event PairsLocked();

    error ZeroAddress();
    error HookRejected(address receiver);
    error NotAContract(address account);
    error PairsAreLocked();

    constructor(address initialHolder, address treasury_)
        ERC20("AGI", "AGI")
        ERC20Permit("AGI")
        Ownable(msg.sender)
    {
        if (initialHolder == address(0) || treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        isTaxExempt[treasury_] = true;
        isTaxExempt[initialHolder] = true;
        emit TreasuryUpdated(treasury_);
        _mint(initialHolder, MAX_SUPPLY);
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        isTaxExempt[treasury_] = true;
        emit TreasuryUpdated(treasury_);
        emit TaxExemptSet(treasury_, true);
    }

    function setPair(address pair, bool flagged) external onlyOwner {
        if (pairsLocked) revert PairsAreLocked();
        if (pair == address(0)) revert ZeroAddress();
        isPair[pair] = flagged;
        emit PairSet(pair, flagged);
    }

    /// @notice Irreversibly freezes the pair list.
    function lockPairs() external onlyOwner {
        pairsLocked = true;
        emit PairsLocked();
    }

    function setTaxExempt(address account, bool exempt) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        isTaxExempt[account] = exempt;
        emit TaxExemptSet(account, exempt);
    }

    /// @notice Only contracts may be hooks; an EOA hook would make every
    ///         transfer to it revert.
    function setReceiverHook(address receiver, bool enabled) external onlyOwner {
        if (receiver == address(0)) revert ZeroAddress();
        if (enabled && receiver.code.length == 0) revert NotAContract(receiver);
        isReceiverHook[receiver] = enabled;
        emit ReceiverHookSet(receiver, enabled);
    }

    // ---------------------------------------------------------------------
    // Transfer logic
    // ---------------------------------------------------------------------

    function _update(address from, address to, uint256 value) internal override {
        uint256 received = value;

        bool taxed = from != address(0) &&
            to != address(0) &&
            value != 0 &&
            (isPair[from] || isPair[to]) &&
            !isTaxExempt[from] &&
            !isTaxExempt[to];

        if (taxed) {
            uint256 tax = (value * TAX_BPS) / 10_000;
            received = value - tax;
            super._update(from, treasury, tax);
            super._update(from, to, received);
        } else {
            super._update(from, to, value);
        }

        // Notify hook contracts after balances are final (checks-effects-
        // interactions). A revert in the hook reverts the whole transfer, so
        // a sender never loses funds to a hook that could not process them.
        if (from != address(0) && received != 0 && isReceiverHook[to]) {
            if (IAGIReceiver(to).onAGIReceived(from, received) != IAGIReceiver.onAGIReceived.selector) {
                revert HookRejected(to);
            }
        }
    }
}
