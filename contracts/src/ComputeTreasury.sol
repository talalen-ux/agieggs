// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

/// @title ComputeTreasury — funds GPU work for AGI.Pets.
/// @notice Receives the AGI trade tax and egg proceeds (AGI and ETH).
///  - Holders convert AGI into compute credits with `convertToCredits`. The
///    AGI moves into the treasury and the credits are recorded on-chain.
///  - Whitelisted compute providers claim AGI for completed work using a
///    receipt signed (EIP-712) by the protocol orchestrator.
contract ComputeTreasury is Ownable2Step, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;

    uint256 public constant CREDITS_PER_AGI = 10;
    bytes32 public constant PAYOUT_TYPEHASH =
        keccak256("Payout(address provider,uint256 amount,bytes32 batchId,uint256 deadline)");

    IERC20 public immutable agi;
    address public orchestrator;
    mapping(address => bool) public isProvider;
    mapping(bytes32 => bool) public batchPaid;
    mapping(address => uint256) public creditsOf;

    event CreditsPurchased(address indexed account, uint256 agiAmount, uint256 credits);
    event ProviderSet(address indexed provider, bool allowed);
    event OrchestratorUpdated(address indexed orchestrator);
    event ProviderPaid(address indexed provider, uint256 amount, bytes32 indexed batchId);
    event Withdrawn(address indexed asset, address indexed to, uint256 amount);

    error ZeroAddress();
    error ZeroAmount();
    error NotProvider();
    error Expired();
    error AlreadyPaid();
    error BadSignature();

    constructor(IERC20 agi_, address orchestrator_) Ownable(msg.sender) EIP712("AGI.Pets ComputeTreasury", "1") {
        if (address(agi_) == address(0) || orchestrator_ == address(0)) revert ZeroAddress();
        agi = agi_;
        orchestrator = orchestrator_;
        emit OrchestratorUpdated(orchestrator_);
    }

    receive() external payable {}

    // ---------------------------------------------------------------------
    // Credits
    // ---------------------------------------------------------------------

    /// @notice Convert AGI into compute credits (requires AGI approval).
    function convertToCredits(uint256 agiAmount) external nonReentrant {
        if (agiAmount == 0) revert ZeroAmount();
        uint256 credits = agiAmount * CREDITS_PER_AGI;
        creditsOf[msg.sender] += credits; // effects before the external call
        emit CreditsPurchased(msg.sender, agiAmount, credits);
        agi.safeTransferFrom(msg.sender, address(this), agiAmount);
    }

    // ---------------------------------------------------------------------
    // Provider payouts
    // ---------------------------------------------------------------------

    function claim(uint256 amount, bytes32 batchId, uint256 deadline, bytes calldata signature)
        external
        nonReentrant
    {
        if (!isProvider[msg.sender]) revert NotProvider();
        if (block.timestamp > deadline) revert Expired();
        if (batchPaid[batchId]) revert AlreadyPaid();
        if (amount == 0) revert ZeroAmount();

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(PAYOUT_TYPEHASH, msg.sender, amount, batchId, deadline))
        );
        // ECDSA.recover rejects malleable (high-s) signatures and bad lengths.
        if (ECDSA.recover(digest, signature) != orchestrator) revert BadSignature();

        batchPaid[batchId] = true;
        agi.safeTransfer(msg.sender, amount);
        emit ProviderPaid(msg.sender, amount, batchId);
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setProvider(address provider, bool allowed) external onlyOwner {
        if (provider == address(0)) revert ZeroAddress();
        isProvider[provider] = allowed;
        emit ProviderSet(provider, allowed);
    }

    function setOrchestrator(address orchestrator_) external onlyOwner {
        if (orchestrator_ == address(0)) revert ZeroAddress();
        orchestrator = orchestrator_;
        emit OrchestratorUpdated(orchestrator_);
    }

    function withdrawETH(address payable to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        Address.sendValue(to, amount);
        emit Withdrawn(address(0), to, amount);
    }

    function withdrawToken(IERC20 token, address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        token.safeTransfer(to, amount);
        emit Withdrawn(address(token), to, amount);
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
