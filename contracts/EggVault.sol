// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title EggVault — non-transferable egg accrual tied to wallet AGI value.
/// @notice Eggs are soulbound. They accrue while the wallet's USD-denominated
///         holdings sit inside their committed band. This is what kills bots
///         and whale dominance: there is no secondary market for eggs.
contract EggVault is Ownable {
    IERC20 public immutable agi;
    AggregatorV3Interface public priceFeed; // AGI/USD oracle

    // Egg accounting per wallet.
    struct Account {
        uint128 eggs; // 1e18-scaled fragments
        uint64 lastAccrualAt;
    }

    mapping(address => Account) public accounts;

    uint256 public constant ENTRY_THRESHOLD_USD_E8 = 25 * 1e8; // $25
    uint256 public constant EGG_RATE_PER_USD_DAY = 4e17; // 0.4 e18
    uint256 public constant DAILY_CAP_PER_WALLET = 3e18;
    uint256 public constant MAX_PENDING = 5e18;

    event EggAccrued(address indexed user, uint256 amount);
    event EggBurned(address indexed user, uint256 amount, address indexed by);

    error BelowBand();
    error CapReached();
    error NotMinter();

    address public petMinter;

    constructor(IERC20 _agi, AggregatorV3Interface _feed)
        Ownable(msg.sender)
    {
        agi = _agi;
        priceFeed = _feed;
    }

    function setMinter(address m) external onlyOwner {
        petMinter = m;
    }

    function setFeed(AggregatorV3Interface f) external onlyOwner {
        priceFeed = f;
    }

    /// @notice Accrue eggs for the caller. Public so anyone can crank their own.
    function accrue() external {
        _accrue(msg.sender);
    }

    function _accrue(address user) internal {
        Account storage a = accounts[user];
        uint64 nowTs = uint64(block.timestamp);
        if (a.lastAccrualAt == 0) {
            a.lastAccrualAt = nowTs;
            return;
        }
        uint256 elapsed = nowTs - a.lastAccrualAt;
        uint256 holdingsUsd = _holdingsUsd(user);
        a.lastAccrualAt = nowTs;
        if (holdingsUsd < ENTRY_THRESHOLD_USD_E8) revert BelowBand();
        if (a.eggs >= MAX_PENDING) revert CapReached();

        uint256 dailyAccrual = (holdingsUsd * EGG_RATE_PER_USD_DAY) / 1e8;
        if (dailyAccrual > DAILY_CAP_PER_WALLET) dailyAccrual = DAILY_CAP_PER_WALLET;
        uint256 gained = (dailyAccrual * elapsed) / 1 days;
        if (a.eggs + gained > MAX_PENDING) gained = MAX_PENDING - a.eggs;
        a.eggs += uint128(gained);
        emit EggAccrued(user, gained);
    }

    /// @notice Burn one egg to mint a pet. Only the configured pet contract.
    function consumeEgg(address user) external returns (bool) {
        if (msg.sender != petMinter) revert NotMinter();
        Account storage a = accounts[user];
        if (a.eggs < 1e18) return false;
        a.eggs -= 1e18;
        emit EggBurned(user, 1e18, msg.sender);
        return true;
    }

    function eggsOf(address u) external view returns (uint256) {
        return accounts[u].eggs;
    }

    function _holdingsUsd(address user) internal view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        if (price <= 0) return 0;
        uint256 bal = agi.balanceOf(user);
        return (bal * uint256(price)) / 1e18;
    }
}
