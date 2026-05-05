// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IEggVault {
    function consumeEgg(address user) external returns (bool);
}

/// @title PetNFT — the on-chain identity of an AGI.Pet.
/// @notice Stores stage, traits, XP, intelligence score, and a memory hash
///         that points to off-chain memory (IPFS/Arweave). Hard-capped at 5,000.
contract PetNFT is ERC721, Ownable {
    uint16 public constant MAX_PETS = 5_000;

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
        bytes32 memoryHash; // off-chain memory anchor
        uint64 bornAt;
    }

    uint16 public minted;
    mapping(uint256 => Pet) public pets;

    address public eggVault;
    address public evolutionEngine;

    event Hatched(uint256 indexed petId, address indexed owner, bytes32 seed);
    event StageAdvanced(uint256 indexed petId, Stage stage);
    event MemoryUpdated(uint256 indexed petId, bytes32 hash);

    error Capped();
    error NoEgg();
    error NotEvolutionEngine();

    constructor() ERC721("AGI.Pet", "PET") Ownable(msg.sender) {}

    function setEggVault(address v) external onlyOwner {
        eggVault = v;
    }

    function setEvolutionEngine(address e) external onlyOwner {
        evolutionEngine = e;
    }

    /// @notice Burn an egg fragment from the caller and mint their pet.
    function mintPet() external returns (uint256 id) {
        if (minted >= MAX_PETS) revert Capped();
        bool consumed = IEggVault(eggVault).consumeEgg(msg.sender);
        if (!consumed) revert NoEgg();
        unchecked { id = ++minted; }
        bytes32 seed = keccak256(
            abi.encodePacked(id, msg.sender, blockhash(block.number - 1))
        );
        pets[id] = _rollPet(seed);
        _safeMint(msg.sender, id);
        emit Hatched(id, msg.sender, seed);
    }

    function advanceStage(uint256 id, uint16 intelligenceBonus) external {
        if (msg.sender != evolutionEngine) revert NotEvolutionEngine();
        Pet storage p = pets[id];
        require(uint8(p.stage) < uint8(Stage.AGI), "max stage");
        p.stage = Stage(uint8(p.stage) + 1);
        unchecked { p.intelligence += intelligenceBonus; }
        emit StageAdvanced(id, p.stage);
    }

    function setMemoryHash(uint256 id, bytes32 h) external {
        if (msg.sender != evolutionEngine && msg.sender != ownerOf(id))
            revert NotEvolutionEngine();
        pets[id].memoryHash = h;
        emit MemoryUpdated(id, h);
    }

    function _rollPet(bytes32 seed) internal view returns (Pet memory p) {
        uint256 r = uint256(seed);
        p.stage = Stage.Hatchling;
        p.hue = uint16(r % 360); r >>= 9;
        p.pattern = uint8(r % 5); r >>= 3;
        uint256 rar = r % 1000; r >>= 10;
        p.rarity = rar > 985 ? 3 : rar > 900 ? 2 : rar > 650 ? 1 : 0;
        p.curiosity = uint16(r % 100); r >>= 7;
        p.warmth = uint16(r % 100); r >>= 7;
        p.mischief = uint16(r % 100); r >>= 7;
        p.discipline = uint16(r % 100); r >>= 7;
        p.weirdness = uint16(r % 100);
        p.intelligence = 50 + (p.curiosity * 4) / 10;
        p.bornAt = uint64(block.timestamp);
    }
}
