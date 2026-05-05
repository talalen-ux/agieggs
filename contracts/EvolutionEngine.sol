// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IPetNFT {
    enum Stage { Egg, Hatchling, Juvenile, Sapient, AGI }
    struct Pet {
        Stage stage;
        uint16 hue;
        uint8 pattern;
        uint8 rarity;
        uint16 curiosity;
        uint16 warmth;
        uint16 mischief;
        uint16 discipline;
        uint16 weirdness;
        uint32 experience;
        uint16 intelligence;
        bytes32 memoryHash;
        uint64 bornAt;
    }
    function pets(uint256 id) external view returns (Pet memory);
    function ownerOf(uint256 id) external view returns (address);
    function advanceStage(uint256 id, uint16 bonus) external;
}

/// @title EvolutionEngine — gates stage transitions on USD-denominated holdings.
/// @notice This is the band check: you must hold at least the stage's USD
///         threshold AND meet the XP bar to evolve. Falling below the band
///         later flips the pet into degraded mode (off-chain enforced).
contract EvolutionEngine is Ownable {
    IERC20 public immutable agi;
    IPetNFT public immutable pet;
    AggregatorV3Interface public priceFeed;

    // USD thresholds (1e8 scale) per target stage.
    uint256[5] public stageThresholdUsd = [
        0,
        25 * 1e8,
        100 * 1e8,
        500 * 1e8,
        2_500 * 1e8
    ];

    // XP requirements per stage you are LEAVING.
    uint32[5] public xpRequirement = [0, 100, 400, 1200, 3000];

    event Evolved(uint256 indexed petId, IPetNFT.Stage to);

    error NotOwner();
    error AtMaxStage();
    error InsufficientHoldings(uint256 need, uint256 have);
    error InsufficientXp(uint32 need, uint32 have);

    constructor(IERC20 _agi, IPetNFT _pet, AggregatorV3Interface _feed)
        Ownable(msg.sender)
    {
        agi = _agi;
        pet = _pet;
        priceFeed = _feed;
    }

    function setFeed(AggregatorV3Interface f) external onlyOwner {
        priceFeed = f;
    }

    function canEvolve(uint256 petId) public view returns (bool, string memory) {
        IPetNFT.Pet memory p = pet.pets(petId);
        if (uint8(p.stage) >= uint8(IPetNFT.Stage.AGI)) return (false, "max");
        IPetNFT.Stage target = IPetNFT.Stage(uint8(p.stage) + 1);
        uint256 need = stageThresholdUsd[uint256(target)];
        uint256 have = _holdingsUsd(pet.ownerOf(petId));
        if (have < need) return (false, "below band");
        if (p.experience < xpRequirement[uint256(p.stage)]) return (false, "xp");
        return (true, "");
    }

    function triggerEvolution(uint256 petId) external {
        if (pet.ownerOf(petId) != msg.sender) revert NotOwner();
        IPetNFT.Pet memory p = pet.pets(petId);
        if (uint8(p.stage) >= uint8(IPetNFT.Stage.AGI)) revert AtMaxStage();
        IPetNFT.Stage target = IPetNFT.Stage(uint8(p.stage) + 1);
        uint256 need = stageThresholdUsd[uint256(target)];
        uint256 have = _holdingsUsd(msg.sender);
        if (have < need) revert InsufficientHoldings(need, have);
        if (p.experience < xpRequirement[uint256(p.stage)])
            revert InsufficientXp(xpRequirement[uint256(p.stage)], p.experience);

        uint16 bonus = uint16(80 + (p.curiosity * 6) / 10);
        pet.advanceStage(petId, bonus);
        emit Evolved(petId, target);
    }

    function _holdingsUsd(address user) internal view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        if (price <= 0) return 0;
        return (agi.balanceOf(user) * uint256(price)) / 1e18;
    }
}
