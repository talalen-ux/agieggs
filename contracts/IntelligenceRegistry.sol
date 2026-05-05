// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IntelligenceRegistry — the on-chain face of the off-chain brain.
/// @notice Stores per-pet permissions, skill flags, and the latest memory
///         hash. The off-chain orchestrator reads this before serving any
///         inference, so degraded mode is enforced at the API layer too.
contract IntelligenceRegistry {
    enum Skill { Chat, Memory, Tasks, Tools, APIs, Autonomy, MultiAgent }

    struct Permissions {
        uint64 skillBitmap;     // which skills are unlocked
        uint16 computePriority; // 0..10000 (bps)
        uint64 throttledUntil;  // degraded mode timestamp
        bytes32 memoryHash;     // latest IPFS/Arweave anchor
    }

    address public owner;
    address public evolutionEngine;
    mapping(uint256 => Permissions) public perms;

    event SkillsUpdated(uint256 indexed petId, uint64 bitmap);
    event ComputePriorityUpdated(uint256 indexed petId, uint16 priority);
    event Throttled(uint256 indexed petId, uint64 until);
    event MemoryAnchored(uint256 indexed petId, bytes32 hash);

    error NotEngine();
    error NotOwner();

    modifier onlyEngine() {
        if (msg.sender != evolutionEngine) revert NotEngine();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setEngine(address e) external {
        if (msg.sender != owner) revert NotOwner();
        evolutionEngine = e;
    }

    function setSkills(uint256 petId, uint64 bitmap) external onlyEngine {
        perms[petId].skillBitmap = bitmap;
        emit SkillsUpdated(petId, bitmap);
    }

    function setComputePriority(uint256 petId, uint16 priority) external onlyEngine {
        perms[petId].computePriority = priority;
        emit ComputePriorityUpdated(petId, priority);
    }

    /// @notice Move a pet into degraded mode for a duration. Engine calls
    ///         this when band check fails during a periodic reconciliation.
    function throttle(uint256 petId, uint64 until) external onlyEngine {
        perms[petId].throttledUntil = until;
        emit Throttled(petId, until);
    }

    function anchorMemory(uint256 petId, bytes32 h) external onlyEngine {
        perms[petId].memoryHash = h;
        emit MemoryAnchored(petId, h);
    }

    function isDegraded(uint256 petId) external view returns (bool) {
        return block.timestamp < perms[petId].throttledUntil;
    }
}
