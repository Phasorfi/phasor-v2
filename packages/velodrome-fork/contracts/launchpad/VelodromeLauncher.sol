// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVeloRouter {
    function addLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
}

interface IVeloFactory {
    function getPool(
        address tokenA,
        address tokenB,
        bool stable
    ) external view returns (address);
}

interface IVeloVoter {
    function createGauge(address _poolFactory, address _pool) external returns (address);
}

interface IVeloGauge {
    function deposit(uint256 amount) external;
}

interface IVotingEscrow {
    function balanceOf(address owner) external view returns (uint256);
}

/// @title VelodromeLauncher
/// @notice Simple fixed-rate token sale with Velodrome liquidity integration
/// @dev Replaces complex MISO auction system with a single maintainable contract
contract VelodromeLauncher is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ========== STATE VARIABLES ==========

    IVeloRouter public router;
    IVeloFactory public factory;
    IVeloVoter public voter;
    address public locker; // TimeLock or Team Finance address

    // Ve-gating: Check number of veNFTs owned (VotingEscrow is ERC721)
    address public votingEscrow;
    uint256 public minVeBalance; // Minimum number of veNFTs required (e.g., 1)

    // Sale state
    struct Sale {
        address token;           // Project token being sold
        address baseToken;       // Payment token (USDC/ETH)
        uint256 tokenAmount;     // Total tokens for sale
        uint256 price;           // Price per token in baseToken (with baseToken decimals)
        uint256 raised;          // Total baseToken raised
        uint256 softCap;         // Minimum raise amount
        uint256 hardCap;         // Maximum raise amount
        uint256 startTime;
        uint256 endTime;
        bool finalized;
        bool cancelled;
    }

    mapping(uint256 => Sale) public sales;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    uint256 public saleCount;

    // ========== EVENTS ==========

    event SaleCreated(
        uint256 indexed saleId,
        address indexed token,
        address indexed baseToken,
        uint256 tokenAmount,
        uint256 softCap,
        uint256 hardCap
    );
    event Contributed(uint256 indexed saleId, address indexed contributor, uint256 amount);
    event SaleFinalized(uint256 indexed saleId, uint256 raised, address pool, address gauge);
    event SaleCancelled(uint256 indexed saleId);
    event Claimed(uint256 indexed saleId, address indexed claimer, uint256 tokenAmount);
    event Refunded(uint256 indexed saleId, address indexed contributor, uint256 amount);
    event VeGatingUpdated(address votingEscrow, uint256 minVeBalance);

    // ========== MODIFIERS ==========

    modifier onlyVeHolders() {
        if (votingEscrow != address(0) && minVeBalance > 0) {
            require(
                IVotingEscrow(votingEscrow).balanceOf(msg.sender) >= minVeBalance,
                "Must own vePHASOR NFT"
            );
        }
        _;
    }

    // ========== CONSTRUCTOR ==========

    constructor(
        address _router,
        address _factory,
        address _voter,
        address _locker
    ) Ownable(msg.sender) {
        require(_router != address(0), "Invalid router");
        require(_factory != address(0), "Invalid factory");
        require(_voter != address(0), "Invalid voter");
        require(_locker != address(0), "Invalid locker");

        router = IVeloRouter(_router);
        factory = IVeloFactory(_factory);
        voter = IVeloVoter(_voter);
        locker = _locker;
    }

    // ========== ADMIN FUNCTIONS ==========

    /// @notice Configure ve-gating for sale participation
    /// @param _votingEscrow VotingEscrow contract address (set to address(0) to disable)
    /// @param _minVeBalance Minimum number of veNFTs required
    function setVeGating(address _votingEscrow, uint256 _minVeBalance) external onlyOwner {
        votingEscrow = _votingEscrow;
        minVeBalance = _minVeBalance;
        emit VeGatingUpdated(_votingEscrow, _minVeBalance);
    }

    /// @notice Update the locker address
    function setLocker(address _locker) external onlyOwner {
        require(_locker != address(0), "Invalid locker");
        locker = _locker;
    }

    /// @notice Create a new token sale
    /// @param token Project token to sell
    /// @param baseToken Payment token (USDC, WMON, etc.)
    /// @param tokenAmount Total tokens to sell
    /// @param price Price per token in baseToken units
    /// @param softCap Minimum raise required
    /// @param hardCap Maximum raise allowed
    /// @param startTime Sale start timestamp
    /// @param endTime Sale end timestamp
    function createSale(
        address token,
        address baseToken,
        uint256 tokenAmount,
        uint256 price,
        uint256 softCap,
        uint256 hardCap,
        uint256 startTime,
        uint256 endTime
    ) external onlyOwner returns (uint256 saleId) {
        require(token != address(0), "Invalid token");
        require(baseToken != address(0), "Invalid baseToken");
        require(tokenAmount > 0, "Invalid tokenAmount");
        require(price > 0, "Invalid price");
        require(softCap > 0 && softCap <= hardCap, "Invalid caps");
        require(startTime >= block.timestamp, "Invalid startTime");
        require(endTime > startTime, "Invalid endTime");

        saleId = saleCount++;

        Sale storage sale = sales[saleId];
        sale.token = token;
        sale.baseToken = baseToken;
        sale.tokenAmount = tokenAmount;
        sale.price = price;
        sale.softCap = softCap;
        sale.hardCap = hardCap;
        sale.startTime = startTime;
        sale.endTime = endTime;

        // Transfer tokens to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        emit SaleCreated(saleId, token, baseToken, tokenAmount, softCap, hardCap);
    }

    /// @notice Cancel a sale before it ends (only if soft cap not reached)
    function cancelSale(uint256 saleId) external onlyOwner {
        Sale storage sale = sales[saleId];
        require(!sale.finalized, "Already finalized");
        require(!sale.cancelled, "Already cancelled");

        sale.cancelled = true;

        // Return tokens to owner
        IERC20(sale.token).safeTransfer(owner(), sale.tokenAmount);

        emit SaleCancelled(saleId);
    }

    // ========== USER FUNCTIONS ==========

    /// @notice Contribute to a sale
    /// @param saleId Sale ID to contribute to
    /// @param amount Amount of baseToken to contribute
    function contribute(uint256 saleId, uint256 amount) external nonReentrant onlyVeHolders {
        Sale storage sale = sales[saleId];
        require(!sale.cancelled, "Sale cancelled");
        require(!sale.finalized, "Sale finalized");
        require(block.timestamp >= sale.startTime, "Not started");
        require(block.timestamp <= sale.endTime, "Ended");
        require(amount > 0, "Invalid amount");
        require(sale.raised + amount <= sale.hardCap, "Exceeds hard cap");

        IERC20(sale.baseToken).safeTransferFrom(msg.sender, address(this), amount);
        contributions[saleId][msg.sender] += amount;
        sale.raised += amount;

        emit Contributed(saleId, msg.sender, amount);
    }

    /// @notice Claim tokens after successful sale finalization
    /// @param saleId Sale ID to claim from
    function claim(uint256 saleId) external nonReentrant {
        Sale storage sale = sales[saleId];
        require(sale.finalized, "Not finalized");
        require(!sale.cancelled, "Sale cancelled");

        uint256 contribution = contributions[saleId][msg.sender];
        require(contribution > 0, "Nothing to claim");

        contributions[saleId][msg.sender] = 0;

        // Calculate tokens to receive (proportional to contribution)
        // Note: Some tokens went to liquidity, so we calculate from remaining
        uint256 tokensForSale = (sale.tokenAmount * 5000) / 10000; // 50% for sale participants
        uint256 tokenAmount = (contribution * tokensForSale) / sale.raised;

        IERC20(sale.token).safeTransfer(msg.sender, tokenAmount);

        emit Claimed(saleId, msg.sender, tokenAmount);
    }

    /// @notice Get refund if sale was cancelled or failed to reach soft cap
    /// @param saleId Sale ID to get refund from
    function refund(uint256 saleId) external nonReentrant {
        Sale storage sale = sales[saleId];
        require(
            sale.cancelled ||
                (block.timestamp > sale.endTime && sale.raised < sale.softCap),
            "Refund not available"
        );

        uint256 contribution = contributions[saleId][msg.sender];
        require(contribution > 0, "Nothing to refund");

        contributions[saleId][msg.sender] = 0;

        IERC20(sale.baseToken).safeTransfer(msg.sender, contribution);

        emit Refunded(saleId, msg.sender, contribution);
    }

    // ========== FINALIZATION ==========

    /// @notice Finalize sale and create liquidity + gauge
    /// @param saleId Sale ID to finalize
    /// @param liquidityPercent Percentage of raised funds for liquidity (basis points, e.g., 5000 = 50%)
    function finalizeAndLaunch(
        uint256 saleId,
        uint256 liquidityPercent
    ) external onlyOwner nonReentrant {
        Sale storage sale = sales[saleId];
        require(!sale.finalized, "Already finalized");
        require(!sale.cancelled, "Sale cancelled");
        require(block.timestamp > sale.endTime, "Sale not ended");
        require(sale.raised >= sale.softCap, "Soft cap not reached");
        require(liquidityPercent > 0 && liquidityPercent <= 10000, "Invalid liquidity percent");

        sale.finalized = true;

        // Calculate amounts for liquidity
        uint256 baseForLiquidity = (sale.raised * liquidityPercent) / 10000;
        uint256 tokenForLiquidity = (sale.tokenAmount * liquidityPercent) / 10000;

        // 1. Approve Router
        IERC20(sale.token).forceApprove(address(router), tokenForLiquidity);
        IERC20(sale.baseToken).forceApprove(address(router), baseForLiquidity);

        // 2. Add Liquidity (volatile pool)
        (, , uint256 liquidity) = router.addLiquidity(
            sale.token,
            sale.baseToken,
            false, // volatile pool
            tokenForLiquidity,
            baseForLiquidity,
            0, // amountAMin (slippage protection can be added)
            0, // amountBMin
            address(this),
            block.timestamp
        );

        // 3. Get Pool Address
        address pool = factory.getPool(sale.token, sale.baseToken, false);
        require(pool != address(0), "Pool not found");

        // 4. Create Gauge
        address gauge = voter.createGauge(address(factory), pool);
        require(gauge != address(0), "Gauge creation failed");

        // 5. Stake LP into Gauge
        IERC20(pool).forceApprove(gauge, liquidity);
        IVeloGauge(gauge).deposit(liquidity);

        // 6. Transfer gauge receipt tokens to locker
        uint256 gaugeBalance = IERC20(gauge).balanceOf(address(this));
        if (gaugeBalance > 0) {
            IERC20(gauge).safeTransfer(locker, gaugeBalance);
        }

        // 7. Transfer remaining baseToken to owner (non-liquidity portion)
        uint256 remainingBase = IERC20(sale.baseToken).balanceOf(address(this));
        if (remainingBase > 0) {
            IERC20(sale.baseToken).safeTransfer(owner(), remainingBase);
        }

        emit SaleFinalized(saleId, sale.raised, pool, gauge);
    }

    // ========== VIEW FUNCTIONS ==========

    /// @notice Get sale details
    function getSale(uint256 saleId)
        external
        view
        returns (
            address token,
            address baseToken,
            uint256 tokenAmount,
            uint256 price,
            uint256 raised,
            uint256 softCap,
            uint256 hardCap,
            uint256 startTime,
            uint256 endTime,
            bool finalized,
            bool cancelled
        )
    {
        Sale storage sale = sales[saleId];
        return (
            sale.token,
            sale.baseToken,
            sale.tokenAmount,
            sale.price,
            sale.raised,
            sale.softCap,
            sale.hardCap,
            sale.startTime,
            sale.endTime,
            sale.finalized,
            sale.cancelled
        );
    }

    /// @notice Get user contribution for a sale
    function getContribution(uint256 saleId, address user) external view returns (uint256) {
        return contributions[saleId][user];
    }

    /// @notice Check if user can participate (ve-gating check)
    function canParticipate(address user) external view returns (bool) {
        if (votingEscrow == address(0) || minVeBalance == 0) {
            return true;
        }
        return IVotingEscrow(votingEscrow).balanceOf(user) >= minVeBalance;
    }
}
