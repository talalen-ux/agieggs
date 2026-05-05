// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ComputeTreasury — funds inference and GPU work.
/// @notice Receives the AGI tax. Whitelisted compute providers (e.g. PinLink
///         GPU marketplace) can stream AGI out against signed work receipts.
///         The signer is the protocol's off-chain orchestrator.
contract ComputeTreasury is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable agi;
    address public orchestrator;
    mapping(address => bool) public providerAllowed;
    mapping(bytes32 => bool) public usedReceipts;

    event ProviderSet(address indexed provider, bool allowed);
    event Paid(address indexed provider, uint256 amount, bytes32 receipt);
    event OrchestratorUpdated(address indexed orchestrator);

    error NotAllowed();
    error BadSignature();
    error AlreadyUsed();

    constructor(IERC20 _agi, address _orchestrator) Ownable(msg.sender) {
        agi = _agi;
        orchestrator = _orchestrator;
    }

    function setProvider(address p, bool ok) external onlyOwner {
        providerAllowed[p] = ok;
        emit ProviderSet(p, ok);
    }

    function setOrchestrator(address o) external onlyOwner {
        orchestrator = o;
        emit OrchestratorUpdated(o);
    }

    /// @notice Provider claims compensation for completed inference jobs.
    /// @dev Receipt = keccak256(abi.encode(provider, amount, jobBatchId, deadline)).
    function claim(
        uint256 amount,
        bytes32 jobBatchId,
        uint64 deadline,
        bytes calldata sig
    ) external {
        if (!providerAllowed[msg.sender]) revert NotAllowed();
        require(block.timestamp <= deadline, "expired");
        bytes32 receipt = keccak256(
            abi.encode(msg.sender, amount, jobBatchId, deadline, address(this))
        );
        if (usedReceipts[receipt]) revert AlreadyUsed();
        if (!_verify(receipt, sig, orchestrator)) revert BadSignature();
        usedReceipts[receipt] = true;
        agi.safeTransfer(msg.sender, amount);
        emit Paid(msg.sender, amount, receipt);
    }

    function _verify(bytes32 hash, bytes calldata sig, address signer)
        internal
        pure
        returns (bool)
    {
        if (sig.length != 65) return false;
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        bytes32 prefixed = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
        return ecrecover(prefixed, v, r, s) == signer;
    }
}
