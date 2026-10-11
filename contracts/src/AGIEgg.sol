// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {IAGIReceiver} from "./AGIToken.sol";

/// @title AGI.Pets Egg — an ERC-721 egg with three ways to acquire it.
/// @notice
///  1. Connected: call `mintWithAGI` (after approving AGI) or `mintWithETH`
///     and choose the design.
///  2. Send AGI: transfer AGI straight to this contract from any wallet. The
///     AGI token calls `onAGIReceived`, which mints eggs to the sender.
///  3. Send ETH: send ETH straight to this contract from any wallet.
///  For 2 and 3 the design is assigned pseudo-randomly; designs are purely
///  cosmetic. Any amount above whole eggs is refunded in the same
///  transaction, and if nothing can be minted the whole send reverts, so
///  funds are never kept without an egg in return.
///  Proceeds are forwarded to the treasury immediately; this contract does
///  not custody user funds.
contract AGIEgg is ERC721, Ownable2Step, ReentrancyGuard, Pausable, IAGIReceiver {
    using SafeERC20 for IERC20;
    using Strings for uint256;

    enum PaidWith {
        AGI,
        ETH
    }

    struct Egg {
        uint16 design;
        bool hatched;
    }

    uint256 public constant MAX_PER_TX = 10;

    IERC20 public immutable agi;
    uint256 public immutable maxSupply;

    address public treasury;
    uint256 public priceAGI; // AGI (18 decimals) per egg; 0 disables AGI minting
    uint256 public priceETH; // wei per egg; 0 disables ETH minting
    uint256 public minHoldToHatch; // AGI balance needed to hatch
    uint16 public designCount; // only ever increases
    bool public hatchingOpen; // hatching is "coming soon" until enabled
    string public imageBaseURI;
    uint256 public totalMinted;

    mapping(uint256 => Egg) private _eggs;

    event EggMinted(address indexed to, uint256 indexed tokenId, uint16 design, PaidWith paidWith);
    event Hatched(uint256 indexed tokenId, address indexed owner);
    event Refunded(address indexed to, uint256 amount, PaidWith asset);
    event PricesSet(uint256 priceAGI, uint256 priceETH);
    event TreasuryUpdated(address indexed treasury);
    event DesignCountSet(uint16 designCount);
    event HatchingOpenSet(bool open);
    event MinHoldSet(uint256 minHoldToHatch);
    event ImageBaseURISet(string uri);

    error ZeroAddress();
    error InvalidQuantity();
    error InvalidDesign();
    error SoldOut();
    error PaymentDisabled();
    error InsufficientPayment();
    error CostAboveMax(uint256 cost, uint256 maxCost);
    error OnlyAGI();
    error HatchingClosed();
    error NotEggOwner();
    error AlreadyHatched();
    error HoldTooLow(uint256 balance, uint256 required);
    error DesignCountDecrease();
    error InvalidURI();

    constructor(
        IERC20 agi_,
        address treasury_,
        uint256 maxSupply_,
        uint16 designCount_,
        uint256 priceAGI_,
        uint256 priceETH_,
        uint256 minHoldToHatch_,
        string memory imageBaseURI_
    ) ERC721("AGI.Pets Egg", "EGG") Ownable(msg.sender) {
        if (address(agi_) == address(0) || treasury_ == address(0)) revert ZeroAddress();
        if (maxSupply_ == 0 || designCount_ == 0) revert InvalidQuantity();
        agi = agi_;
        treasury = treasury_;
        maxSupply = maxSupply_;
        designCount = designCount_;
        priceAGI = priceAGI_;
        priceETH = priceETH_;
        minHoldToHatch = minHoldToHatch_;
        _checkURI(imageBaseURI_);
        imageBaseURI = imageBaseURI_;
    }

    // ---------------------------------------------------------------------
    // Connected minting (design chosen by the buyer)
    // ---------------------------------------------------------------------

    /// @param maxCost Upper bound on AGI pulled, protecting the buyer from a
    ///        price change between signing and execution.
    function mintWithAGI(uint16 design, uint256 quantity, uint256 maxCost)
        external
        nonReentrant
        whenNotPaused
    {
        if (priceAGI == 0) revert PaymentDisabled();
        _checkMint(design, quantity);
        uint256 cost = priceAGI * quantity;
        if (cost > maxCost) revert CostAboveMax(cost, maxCost);

        agi.safeTransferFrom(msg.sender, treasury, cost);
        for (uint256 i; i < quantity; ++i) _mintEgg(msg.sender, design, PaidWith.AGI);
    }

    function mintWithETH(uint16 design, uint256 quantity) external payable nonReentrant whenNotPaused {
        if (priceETH == 0) revert PaymentDisabled();
        _checkMint(design, quantity);
        uint256 cost = priceETH * quantity;
        if (msg.value < cost) revert InsufficientPayment();

        for (uint256 i; i < quantity; ++i) _mintEgg(msg.sender, design, PaidWith.ETH);
        Address.sendValue(payable(treasury), cost);
        _refundETH(msg.sender, msg.value - cost);
    }

    // ---------------------------------------------------------------------
    // Direct sends (no site connection needed)
    // ---------------------------------------------------------------------

    /// @notice Called by the AGI token when AGI is transferred to this
    ///         contract. Mints as many eggs as the amount covers (up to
    ///         MAX_PER_TX and remaining supply) and refunds the rest.
    function onAGIReceived(address from, uint256 amount)
        external
        override
        nonReentrant
        whenNotPaused
        returns (bytes4)
    {
        if (msg.sender != address(agi)) revert OnlyAGI();
        if (priceAGI == 0) revert PaymentDisabled();

        uint256 quantity = _affordable(amount, priceAGI);
        uint256 cost = priceAGI * quantity;

        for (uint256 i; i < quantity; ++i) _mintEgg(from, _randomDesign(from), PaidWith.AGI);
        agi.safeTransfer(treasury, cost);
        uint256 refund = amount - cost;
        if (refund != 0) {
            agi.safeTransfer(from, refund);
            emit Refunded(from, refund, PaidWith.AGI);
        }
        return IAGIReceiver.onAGIReceived.selector;
    }

    /// @notice Plain ETH sent to this contract mints eggs to the sender.
    receive() external payable nonReentrant whenNotPaused {
        if (priceETH == 0) revert PaymentDisabled();
        uint256 quantity = _affordable(msg.value, priceETH);
        uint256 cost = priceETH * quantity;

        for (uint256 i; i < quantity; ++i) _mintEgg(msg.sender, _randomDesign(msg.sender), PaidWith.ETH);
        Address.sendValue(payable(treasury), cost);
        _refundETH(msg.sender, msg.value - cost);
    }

    // ---------------------------------------------------------------------
    // Hatching
    // ---------------------------------------------------------------------

    function hatch(uint256 tokenId) external nonReentrant whenNotPaused {
        if (!hatchingOpen) revert HatchingClosed();
        if (ownerOf(tokenId) != msg.sender) revert NotEggOwner();
        Egg storage egg = _eggs[tokenId];
        if (egg.hatched) revert AlreadyHatched();
        uint256 bal = agi.balanceOf(msg.sender);
        if (bal < minHoldToHatch) revert HoldTooLow(bal, minHoldToHatch);
        egg.hatched = true;
        emit Hatched(tokenId, msg.sender);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function eggOf(uint256 tokenId) external view returns (uint16 design, bool hatched) {
        _requireOwned(tokenId);
        Egg memory egg = _eggs[tokenId];
        return (egg.design, egg.hatched);
    }

    function remaining() public view returns (uint256) {
        return maxSupply - totalMinted;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Egg memory egg = _eggs[tokenId];
        string memory design = uint256(egg.design).toString();
        bytes memory json = abi.encodePacked(
            '{"name":"AGI.Pets Egg #',
            tokenId.toString(),
            '","description":"An AGI.Pets egg. What is inside is coming soon.","image":"',
            imageBaseURI,
            design,
            '","attributes":[{"trait_type":"Design","value":',
            design,
            '},{"trait_type":"State","value":"',
            egg.hatched ? "Hatched" : "Sealed",
            '"}]}'
        );
        return string.concat("data:application/json;base64,", Base64.encode(json));
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setPrices(uint256 priceAGI_, uint256 priceETH_) external onlyOwner {
        priceAGI = priceAGI_;
        priceETH = priceETH_;
        emit PricesSet(priceAGI_, priceETH_);
    }

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    /// @notice New designs can be added; existing design ids never change.
    function setDesignCount(uint16 designCount_) external onlyOwner {
        if (designCount_ < designCount) revert DesignCountDecrease();
        designCount = designCount_;
        emit DesignCountSet(designCount_);
    }

    function setHatchingOpen(bool open) external onlyOwner {
        hatchingOpen = open;
        emit HatchingOpenSet(open);
    }

    function setMinHoldToHatch(uint256 minHold) external onlyOwner {
        minHoldToHatch = minHold;
        emit MinHoldSet(minHold);
    }

    function setImageBaseURI(string calldata uri) external onlyOwner {
        _checkURI(uri);
        imageBaseURI = uri;
        emit ImageBaseURISet(uri);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ---------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------

    function _checkMint(uint16 design, uint256 quantity) private view {
        if (quantity == 0 || quantity > MAX_PER_TX) revert InvalidQuantity();
        if (design >= designCount) revert InvalidDesign();
        if (quantity > remaining()) revert SoldOut();
    }

    /// @dev Whole eggs covered by `amount`, capped by MAX_PER_TX and supply.
    ///      Reverts if not even one egg can be minted, so the payment returns.
    function _affordable(uint256 amount, uint256 price) private view returns (uint256 quantity) {
        quantity = amount / price;
        if (quantity > MAX_PER_TX) quantity = MAX_PER_TX;
        uint256 left = remaining();
        if (quantity > left) quantity = left;
        if (left == 0) revert SoldOut();
        if (quantity == 0) revert InsufficientPayment();
    }

    function _mintEgg(address to, uint16 design, PaidWith paidWith) private {
        uint256 tokenId = ++totalMinted; // ids start at 1
        _eggs[tokenId] = Egg({design: design, hatched: false});
        _safeMint(to, tokenId);
        emit EggMinted(to, tokenId, design, paidWith);
    }

    /// @dev Cosmetic only. Validators can bias this; designs carry no
    ///      economic difference, so that is acceptable.
    function _randomDesign(address to) private view returns (uint16) {
        return uint16(
            uint256(keccak256(abi.encode(block.prevrandao, block.timestamp, to, totalMinted))) % designCount
        );
    }

    /// @dev The URI is embedded in JSON metadata; quotes or backslashes would
    ///      corrupt it.
    function _checkURI(string memory uri) private pure {
        bytes memory b = bytes(uri);
        for (uint256 i; i < b.length; ++i) {
            if (b[i] == 0x22 || b[i] == 0x5c) revert InvalidURI();
        }
    }

    function _refundETH(address to, uint256 amount) private {
        if (amount == 0) return;
        Address.sendValue(payable(to), amount);
        emit Refunded(to, amount, PaidWith.ETH);
    }
}
