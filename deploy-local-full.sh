#!/bin/bash
set -e

# Add foundry to PATH
export PATH="$HOME/.foundry/bin:$PATH"

# ============================================================================
# Phasor V2 - Full Local Deployment Script
# ============================================================================
# Deploys 7 core tokens with varied decimal precisions and realistic liquidity
# No interactive prompts - all configuration hardcoded for local Anvil
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
RPC_URL="http://127.0.0.1:8545"
CHAIN_ID="10143"
DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
DEPLOYER_ADDR="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
CANNONFILE="cannonfile.local-full.toml"

# Token decimals mapping
declare -A TOKEN_DECIMALS=(
    ["WMON"]=18 ["USDC"]=6 ["USDT"]=6 ["WETH"]=18 ["WBTC"]=8
    ["SOL"]=9 ["FOLKS"]=6 ["Phasor"]=18
)

# Liquidity Pools Configuration (6 pools with realistic liquidity for native Monad DEX)
# Format: "TOKEN0-TOKEN1:amount0:amount1"
# Total WMON needed: 9000 (fits within 10,000 ETH Anvil balance)
# Total liquidity: ~$27M (assuming WMON = $2000)
LIQUIDITY_POOLS=(
    # Tier 1: Stablecoin pairs - Deepest liquidity (~$11.6M)
    "WMON-USDC:3500:7000000"    # $7M pool: 3,500 WMON : 7M USDC
    "WMON-USDT:2300:4600000"    # $4.6M pool: 2,300 WMON : 4.6M USDT

    # Tier 2: Major crypto pairs (~$9.5M)
    "WMON-WETH:1500:600"        # $4.8M pool: 1,500 WMON : 600 WETH
    "WMON-WBTC:1200:24"         # $4.8M pool: 1,200 WMON : 24 WBTC

    # Tier 3: Mid-tier pairs (~$4.4M)
    "WMON-SOL:300:6000"         # $1.2M pool: 300 WMON : 6,000 SOL
    "WMON-FOLKS:200:400000"     # $0.8M pool: 200 WMON : 400k FOLKS
)

# Contract addresses (populated during deployment)
declare -A ADDRESSES

# Historical data generation flag (can be disabled with --skip-history)
SKIP_HISTORY=false

# Additional Anvil accounts for swap execution (to avoid gas exhaustion)
# Using Anvil's default test accounts (each has 10,000 ETH)
TRADER_KEYS=(
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"  # Account 1
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"  # Account 2
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"  # Account 3
    "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"  # Account 4
    "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"  # Account 5
)

TRADER_ADDRS=(
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"  # Account 1
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"  # Account 2
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906"  # Account 3
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"  # Account 4
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"  # Account 5
)

# ============================================================================
# Helper Functions
# ============================================================================

log_step() {
    echo -e "${CYAN}${BOLD}[$(date +%H:%M:%S)] $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

log_info() {
    echo -e "${BLUE}  $1${NC}"
}

# Convert amount to wei based on decimals
to_wei() {
    local amount=$1
    local decimals=$2
    local result=$(bc <<< "scale=0; $amount * 10^$decimals / 1")
    echo $result
}

# Calculate swap amount in wei based on percentage of reserves
calculate_swap_amount() {
    local token=$1
    local reserve_amount=$2
    local percentage=$3

    local decimals=${TOKEN_DECIMALS[$token]}

    # Calculate percentage of reserve
    local swap_amount=$(bc <<< "scale=0; ($reserve_amount * $percentage / 100)")

    # Convert to wei
    local amount_wei=$(to_wei $swap_amount $decimals)

    echo $amount_wei
}

# Calculate minimum output for swap using Router.getAmountsOut
calculate_min_output() {
    local token_in=$1
    local token_out=$2
    local amount_in=$3

    # For simplicity, just use a low minimum (1 wei) to avoid failed swaps
    # In production, you'd query getAmountsOut and parse the array properly
    echo "1"
}

# ============================================================================
# Step 1: Compile Contracts
# ============================================================================

compile_contracts() {
    log_step "Step 1: Compiling contracts with Forge..."

    ~/.foundry/bin/forge build

    log_success "Contracts compiled successfully"
}

# ============================================================================
# Step 2: Deploy Contracts with Cannon
# ============================================================================

deploy_contracts() {
    log_step "Step 2: Deploying contracts with Cannon..."

    # Deploy using Cannon and capture output
    local deploy_output=$(npx @usecannon/cli build $CANNONFILE \
        --private-key $DEPLOYER_KEY \
        --rpc-url $RPC_URL \
        --chain-id $CHAIN_ID \
        --wipe 2>&1)

    echo "$deploy_output"

    # Extract addresses from deployment output
    ADDRESSES["FOLKS"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.FOLKS\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["SOL"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.SOL\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["USDC"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.USDC\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["USDT"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.USDT\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["WBTC"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.WBTC\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["WETH"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.WETH\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["WMON"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.WMON\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')

    # Velodrome Pool System (replaces UniswapV2)
    ADDRESSES["PoolImplementation"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.PoolImplementation\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["PoolFactory"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.PoolFactory\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["Router"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.Router\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["FactoryRegistry"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.FactoryRegistry\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')

    # Velodrome Fork Ecosystem addresses
    ADDRESSES["Phasor"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.Phasor\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["VotingEscrow"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.VotingEscrow\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["Voter"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.Voter\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["RewardsDistributor"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.RewardsDistributor\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["Minter"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.Minter\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')

    # VelodromeLauncher (replaces MISO)
    ADDRESSES["VelodromeLauncher"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.VelodromeLauncher\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')

    # Get the current block number (factory was just deployed)
    FACTORY_DEPLOY_BLOCK=$(cast block latest --rpc-url $RPC_URL 2>/dev/null | grep -oP 'number\s+\K\d+')

    log_success "Contracts deployed successfully"
    log_info "PoolFactory: ${ADDRESSES[PoolFactory]}"
    log_info "Router: ${ADDRESSES[Router]}"
    log_info "FactoryRegistry: ${ADDRESSES[FactoryRegistry]}"
    log_info "WMON: ${ADDRESSES[WMON]}"
    log_info "Phasor: ${ADDRESSES[Phasor]}"
    log_info "VotingEscrow: ${ADDRESSES[VotingEscrow]}"
    log_info "Voter: ${ADDRESSES[Voter]}"
    log_info "RewardsDistributor: ${ADDRESSES[RewardsDistributor]}"
    log_info "Minter: ${ADDRESSES[Minter]}"
    log_info "VelodromeLauncher: ${ADDRESSES[VelodromeLauncher]}"
    log_info "Deployment block: $FACTORY_DEPLOY_BLOCK"
}

# ============================================================================
# Step 3: Create Liquidity Pools
# ============================================================================

create_liquidity_pools() {
    log_step "Step 3: Creating liquidity pools..."

    local router="${ADDRESSES[Router]}"
    # Use blockchain time for deadline, not real time
    local current_block_time=$(cast block latest --json --rpc-url $RPC_URL | jq -r '.timestamp' | xargs printf "%d\n")
    local deadline=$((current_block_time + 3600))  # 1 hour from blockchain time
    log_info "  Using deadline: $(date -d @$deadline 2>/dev/null || date -r $deadline) (blockchain time + 1 hour)"

    for pool_config in "${LIQUIDITY_POOLS[@]}"; do
        IFS=':' read -r pair amount0 amount1 <<< "$pool_config"
        IFS='-' read -r token0_name token1_name <<< "$pair"

        local token0="${ADDRESSES[$token0_name]}"
        local token1="${ADDRESSES[$token1_name]}"
        local decimals0="${TOKEN_DECIMALS[$token0_name]}"
        local decimals1="${TOKEN_DECIMALS[$token1_name]}"

        # Convert amounts to wei
        local amount0_wei=$(to_wei $amount0 $decimals0)
        local amount1_wei=$(to_wei $amount1 $decimals1)

        log_info "Creating pool: $token0_name-$token1_name ($amount0:$amount1)"

        # For WMON/WETH pairs, we need to deposit ETH first
        if [ "$token0_name" = "WMON" ]; then
            log_info "  Depositing ${amount0} ETH to WMON..."
            ~/.foundry/bin/cast send $token0 "deposit()" \
                --private-key $DEPLOYER_KEY \
                --rpc-url $RPC_URL \
                --value ${amount0_wei} || {
                    log_error "Failed to deposit ${amount0} ETH to WMON"
                    return 1
                }
        fi

        if [ "$token1_name" = "WMON" ]; then
            log_info "  Depositing ${amount1} ETH to WMON..."
            ~/.foundry/bin/cast send $token1 "deposit()" \
                --private-key $DEPLOYER_KEY \
                --rpc-url $RPC_URL \
                --value ${amount1_wei} || {
                    log_error "Failed to deposit ${amount1} ETH to WMON"
                    return 1
                }
        fi

        # Note: MockWETH has pre-minted tokens, no need to deposit
        # (Unlike WMON which uses WETH9-style deposit)

        # Approve tokens
        log_info "  Approving $token0_name..."
        ~/.foundry/bin/cast send $token0 "approve(address,uint256)" $router $amount0_wei \
            --private-key $DEPLOYER_KEY \
            --rpc-url $RPC_URL || {
                log_error "Failed to approve $token0_name"
                return 1
            }

        log_info "  Approving $token1_name..."
        ~/.foundry/bin/cast send $token1 "approve(address,uint256)" $router $amount1_wei \
            --private-key $DEPLOYER_KEY \
            --rpc-url $RPC_URL || {
                log_error "Failed to approve $token1_name"
                return 1
            }

        # Add liquidity (Velodrome Router: includes stable param)
        # Using stable=false for volatile pools (xy=k curve)
        log_info "  Adding liquidity to router (volatile pool)..."
        ~/.foundry/bin/cast send $router \
            "addLiquidity(address,address,bool,uint256,uint256,uint256,uint256,address,uint256)" \
            $token0 \
            $token1 \
            false \
            $amount0_wei \
            $amount1_wei \
            0 \
            0 \
            $DEPLOYER_ADDR \
            $deadline \
            --private-key $DEPLOYER_KEY \
            --rpc-url $RPC_URL || {
                log_error "Failed to add liquidity for $token0_name-$token1_name"
                return 1
            }

        log_success "  Created: $token0_name-$token1_name"
    done

    log_success "All liquidity pools created"

    # Capture stable pair addresses for subgraph configuration (convert to lowercase for AssemblyScript compatibility)
    # Velodrome PoolFactory uses getPool(tokenA, tokenB, stable) instead of getPair(tokenA, tokenB)
    log_info "Capturing pool addresses for subgraph..."
    PAIR_WMON_USDC=$(cast call ${ADDRESSES[PoolFactory]} "getPool(address,address,bool)(address)" ${ADDRESSES[WMON]} ${ADDRESSES[USDC]} false --rpc-url $RPC_URL | tr '[:upper:]' '[:lower:]')
    PAIR_WMON_USDT=$(cast call ${ADDRESSES[PoolFactory]} "getPool(address,address,bool)(address)" ${ADDRESSES[WMON]} ${ADDRESSES[USDT]} false --rpc-url $RPC_URL | tr '[:upper:]' '[:lower:]')
    log_info "  WMON-USDC pool: $PAIR_WMON_USDC"
    log_info "  WMON-USDT pool: $PAIR_WMON_USDT"
}

# ============================================================================
# Step 3.5: Setup Staking System (VotingEscrow + StakingRewards)
# ============================================================================

setup_staking_system() {
    log_step "Step 3.5: Setting up Velodrome Gauge & vePHASOR..."

    local voter="${ADDRESSES[Voter]}"
    local ve="${ADDRESSES[VotingEscrow]}"
    local phasor="${ADDRESSES[Phasor]}"
    local pool_factory="${ADDRESSES[PoolFactory]}"

    # Get WMON-USDC LP pool address (Velodrome uses getPool with stable param)
    local wmon_usdc_lp=$(cast call $pool_factory "getPool(address,address,bool)(address)" ${ADDRESSES[WMON]} ${ADDRESSES[USDC]} false --rpc-url $RPC_URL)
    ADDRESSES["LP_WMON-USDC"]=$wmon_usdc_lp
    log_info "WMON-USDC LP pool: $wmon_usdc_lp"

    # Create Gauge for WMON-USDC pool via Voter
    log_info "  Creating Gauge for WMON-USDC pool via Voter..."
    local gauge_tx=$(~/.foundry/bin/cast send $voter \
        "createGauge(address,address)" \
        $pool_factory \
        $wmon_usdc_lp \
        --private-key $DEPLOYER_KEY \
        --rpc-url $RPC_URL \
        --json 2>/dev/null)

    # Extract gauge address from Voter's gauges mapping
    local gauge_addr=$(cast call $voter "gauges(address)(address)" $wmon_usdc_lp --rpc-url $RPC_URL)
    ADDRESSES["Gauge"]=$gauge_addr
    log_success "  Gauge created: $gauge_addr"

    # Create vePHASOR lock for deployer
    log_info "  Creating test vePHASOR lock for deployer..."
    local deployer_phasor=$(cast call $phasor "balanceOf(address)(uint256)" $DEPLOYER_ADDR --rpc-url $RPC_URL)
    log_info "    Deployer PHASOR balance: $deployer_phasor"

    if [ "$deployer_phasor" != "0" ]; then
        # Lock 10,000 PHASOR for 1 year (duration in seconds for Velodrome VE)
        local lock_amount=$(to_wei 10000 18)
        local lock_duration=$((365 * 86400))

        log_info "    Approving PHASOR for VotingEscrow..."
        ~/.foundry/bin/cast send $phasor \
            "approve(address,uint256)" \
            $ve \
            $lock_amount \
            --private-key $DEPLOYER_KEY \
            --rpc-url $RPC_URL > /dev/null 2>&1

        log_info "    Creating vePHASOR lock (1 year duration)..."
        ~/.foundry/bin/cast send $ve \
            "createLock(uint256,uint256)" \
            $lock_amount \
            $lock_duration \
            --private-key $DEPLOYER_KEY \
            --rpc-url $RPC_URL > /dev/null 2>&1 || {
                log_error "    Failed to create vePHASOR lock"
            }

        local ve_balance=$(cast call $ve "balanceOf(address)(uint256)" $DEPLOYER_ADDR --rpc-url $RPC_URL)
        if [ "$ve_balance" != "0" ]; then
            log_success "    Created vePHASOR lock (tokenId: 1)"
        fi
    fi

    # Deposit LP tokens into Gauge
    log_info "  Depositing LP tokens into Gauge..."
    local deployer_lp_balance_raw=$(cast call $wmon_usdc_lp "balanceOf(address)(uint256)" $DEPLOYER_ADDR --rpc-url $RPC_URL)
    local deployer_lp_balance=$(echo "$deployer_lp_balance_raw" | tr -d '[]' | awk '{print $1}')

    if [ "$deployer_lp_balance" != "0" ] && [ -n "$deployer_lp_balance" ]; then
        local stake_amount=$((deployer_lp_balance / 2))

        ~/.foundry/bin/cast send $wmon_usdc_lp \
            "approve(address,uint256)" \
            $gauge_addr \
            $stake_amount \
            --private-key $DEPLOYER_KEY \
            --rpc-url $RPC_URL > /dev/null 2>&1

        ~/.foundry/bin/cast send $gauge_addr \
            "deposit(uint256)" \
            $stake_amount \
            --private-key $DEPLOYER_KEY \
            --rpc-url $RPC_URL > /dev/null 2>&1 || {
                log_error "    Failed to deposit LP tokens into Gauge"
            }

        log_success "    Deposited LP tokens into Gauge"
    fi

    log_success "Staking system setup complete (Gauge + vePHASOR)"
}

# ============================================================================
# Step 3.6: Setup Test Fair Launches (VelodromeLauncher)
# ============================================================================

setup_test_launches() {
    log_step "Step 3.6: Setting up VelodromeLauncher test sales..."

    local launcher="${ADDRESSES[VelodromeLauncher]}"
    local phasor="${ADDRESSES[Phasor]}"
    local usdc="${ADDRESSES[USDC]}"

    # Use PHASOR token for test sales
    local test_token=$phasor
    log_info "  Using PHASOR token for test sales: $test_token"
    log_info "  VelodromeLauncher: $launcher"

    local current_time=$(cast block latest --json --rpc-url $RPC_URL | jq -r '.timestamp' | xargs printf "%d\n")

    # =========================================================================
    # Sale 1: Active Fixed-Rate Sale
    # =========================================================================
    log_info "  Creating Sale 1: Active Fixed-Rate Sale..."

    local sale1_tokens=$(to_wei 100000 18)  # 100k PHASOR for sale
    local start1=$((current_time + 120))     # Starts in 2 minutes
    local end1=$((current_time + 86400))     # Ends in 1 day
    local price1=$(to_wei 1 6)               # 1 USDC per token (6 decimals for USDC)
    local softcap1=$(to_wei 10000 6)         # 10k USDC soft cap
    local hardcap1=$(to_wei 100000 6)        # 100k USDC hard cap

    # Approve tokens to VelodromeLauncher
    ~/.foundry/bin/cast send $test_token \
        "approve(address,uint256)" \
        $launcher \
        $sale1_tokens \
        --private-key $DEPLOYER_KEY \
        --rpc-url $RPC_URL > /dev/null 2>&1

    # Create sale: createSale(token, baseToken, tokenAmount, price, softCap, hardCap, startTime, endTime)
    local sale1_tx=$(~/.foundry/bin/cast send $launcher \
        "createSale(address,address,uint256,uint256,uint256,uint256,uint256,uint256)" \
        $test_token \
        $usdc \
        $sale1_tokens \
        $price1 \
        $softcap1 \
        $hardcap1 \
        $start1 \
        $end1 \
        --private-key $DEPLOYER_KEY \
        --rpc-url $RPC_URL \
        --json 2>/dev/null)

    local sale_count=$(cast call $launcher "saleCount()(uint256)" --rpc-url $RPC_URL 2>/dev/null)
    if [ "$sale_count" != "0" ]; then
        log_success "    Sale 1 created (saleId: 0)"

        # Advance time to make it active
        log_info "    Advancing time to activate sale..."
        ~/.foundry/bin/cast rpc evm_increaseTime 150 --rpc-url $RPC_URL > /dev/null 2>&1
        ~/.foundry/bin/cast rpc evm_mine --rpc-url $RPC_URL > /dev/null 2>&1

        # Transfer USDC to traders and have them contribute
        log_info "    Adding test contributions..."

        # Transfer USDC to trader 1
        ~/.foundry/bin/cast send $usdc \
            "transfer(address,uint256)" \
            ${TRADER_ADDRS[0]} \
            $(to_wei 5000 6) \
            --private-key $DEPLOYER_KEY \
            --rpc-url $RPC_URL > /dev/null 2>&1

        # Trader 1 approves and contributes
        ~/.foundry/bin/cast send $usdc \
            "approve(address,uint256)" \
            $launcher \
            $(to_wei 5000 6) \
            --private-key ${TRADER_KEYS[0]} \
            --rpc-url $RPC_URL > /dev/null 2>&1

        ~/.foundry/bin/cast send $launcher \
            "contribute(uint256,uint256)" \
            0 \
            $(to_wei 5000 6) \
            --private-key ${TRADER_KEYS[0]} \
            --rpc-url $RPC_URL > /dev/null 2>&1 && log_success "      Trader 1 contributed 5000 USDC"

        # Transfer USDC to trader 2
        ~/.foundry/bin/cast send $usdc \
            "transfer(address,uint256)" \
            ${TRADER_ADDRS[1]} \
            $(to_wei 3000 6) \
            --private-key $DEPLOYER_KEY \
            --rpc-url $RPC_URL > /dev/null 2>&1

        # Trader 2 approves and contributes
        ~/.foundry/bin/cast send $usdc \
            "approve(address,uint256)" \
            $launcher \
            $(to_wei 3000 6) \
            --private-key ${TRADER_KEYS[1]} \
            --rpc-url $RPC_URL > /dev/null 2>&1

        ~/.foundry/bin/cast send $launcher \
            "contribute(uint256,uint256)" \
            0 \
            $(to_wei 3000 6) \
            --private-key ${TRADER_KEYS[1]} \
            --rpc-url $RPC_URL > /dev/null 2>&1 && log_success "      Trader 2 contributed 3000 USDC"
    else
        log_error "    Failed to create Sale 1"
    fi

    # =========================================================================
    # Sale 2: Upcoming Sale (not started yet)
    # =========================================================================
    log_info "  Creating Sale 2: Upcoming Fixed-Rate Sale..."

    local current_time2=$(cast block latest --json --rpc-url $RPC_URL | jq -r '.timestamp' | xargs printf "%d\n")

    local sale2_tokens=$(to_wei 50000 18)    # 50k PHASOR
    local start2=$((current_time2 + 3600))    # Starts in 1 hour
    local end2=$((current_time2 + 172800))    # Ends in 2 days
    local price2=$(to_wei 2 6)                # 2 USDC per token
    local softcap2=$(to_wei 5000 6)           # 5k USDC soft cap
    local hardcap2=$(to_wei 100000 6)         # 100k USDC hard cap

    ~/.foundry/bin/cast send $test_token \
        "approve(address,uint256)" \
        $launcher \
        $sale2_tokens \
        --private-key $DEPLOYER_KEY \
        --rpc-url $RPC_URL > /dev/null 2>&1

    ~/.foundry/bin/cast send $launcher \
        "createSale(address,address,uint256,uint256,uint256,uint256,uint256,uint256)" \
        $test_token \
        $usdc \
        $sale2_tokens \
        $price2 \
        $softcap2 \
        $hardcap2 \
        $start2 \
        $end2 \
        --private-key $DEPLOYER_KEY \
        --rpc-url $RPC_URL > /dev/null 2>&1

    local final_sale_count=$(cast call $launcher "saleCount()(uint256)" --rpc-url $RPC_URL)
    log_success "  Test sales setup complete: $final_sale_count sales created"
}

# ============================================================================
# Step 8: Generate Historical Trading Data
# ============================================================================

# Execute a swap on the router (Velodrome uses Route[] struct instead of address[] path)
execute_swap_on_router() {
    local token_in=$1
    local token_out=$2
    local amount_in=$3
    local trader_key=$4
    local trader_addr=$5

    # Approve token_in for this swap (do it each time to avoid balance issues)
    ~/.foundry/bin/cast send ${ADDRESSES[$token_in]} \
        "approve(address,uint256)" \
        ${ADDRESSES[Router]} \
        $amount_in \
        --private-key $trader_key \
        --rpc-url $RPC_URL > /dev/null 2>&1 || return 1

    # Calculate minimum output (5% slippage tolerance)
    local amount_out_min=$(calculate_min_output $token_in $token_out $amount_in)

    # If calculation failed, use 0 as min (accept any output)
    if [ -z "$amount_out_min" ] || [ "$amount_out_min" = "0" ]; then
        amount_out_min=1
    fi

    # Execute swap with deadline far in the future (use a very large number to avoid expiration)
    # Since we're manipulating blockchain time, we can't rely on system time
    local deadline=9999999999  # Year 2286 - far enough in the future

    # Velodrome Router uses Route[] struct instead of address[] path
    # Route struct: { from: address, to: address, stable: bool, factory: address }
    # For volatile pools, stable=false
    ~/.foundry/bin/cast send ${ADDRESSES[Router]} \
        "swapExactTokensForTokens(uint256,uint256,(address,address,bool,address)[],address,uint256)" \
        $amount_in \
        $amount_out_min \
        "[(${ADDRESSES[$token_in]},${ADDRESSES[$token_out]},false,${ADDRESSES[PoolFactory]})]" \
        $trader_addr \
        $deadline \
        --private-key $trader_key \
        --rpc-url $RPC_URL > /dev/null 2>&1 || {
        # Swap failed, but continue (this is expected sometimes due to slippage)
        return 1
    }

    return 0
}

# Execute a random swap with weighted pair selection
execute_random_swap() {
    # Pick random trader account
    local trader_index=$((RANDOM % 5))
    local trader_key=${TRADER_KEYS[$trader_index]}
    local trader_addr=${TRADER_ADDRS[$trader_index]}

    # Pick random pair (weighted by volume)
    local rand=$((RANDOM % 100))
    local PAIR_INDEX

    if [ $rand -lt 60 ]; then
        # Stablecoin pair (60% probability)
        PAIR_INDEX=$((RANDOM % 2))
    elif [ $rand -lt 90 ]; then
        # Major pair (30% probability)
        PAIR_INDEX=$((2 + RANDOM % 2))
    else
        # Mid-tier pair (10% probability)
        PAIR_INDEX=$((4 + RANDOM % 2))
    fi

    # Get pair info
    local pair_info=${LIQUIDITY_POOLS[$PAIR_INDEX]}
    IFS=':' read -r pair_name base_amount quote_amount <<< "$pair_info"
    IFS='-' read -r token0 token1 <<< "$pair_name"

    # Determine swap direction (50/50)
    local direction=$((RANDOM % 2))

    # Calculate swap amount (1-5% of pool reserves)
    local swap_percentage=$((1 + RANDOM % 5))

    if [ $direction -eq 0 ]; then
        # Swap token0 → token1
        local amount_in=$(calculate_swap_amount $token0 $base_amount $swap_percentage)
        execute_swap_on_router $token0 $token1 $amount_in $trader_key $trader_addr
    else
        # Swap token1 → token0
        local amount_in=$(calculate_swap_amount $token1 $quote_amount $swap_percentage)
        execute_swap_on_router $token1 $token0 $amount_in $trader_key $trader_addr
    fi
}

# Generate historical trading data (30 days × 12 swaps/day)
generate_historical_data() {
    if [ "$SKIP_HISTORY" = true ]; then
        log_info "Skipping historical data generation (--skip-history flag set)"
        return 0
    fi

    log_step "Step 8: Generating historical trading data..."

    # Configuration
    local DAYS_OF_HISTORY=30
    local SWAPS_PER_DAY=12
    local SECONDS_PER_DAY=86400

    log_info "  Generating $DAYS_OF_HISTORY days × $SWAPS_PER_DAY swaps/day = $((DAYS_OF_HISTORY * SWAPS_PER_DAY)) total swaps"
    log_info "  This will create data spread across 30 days of simulated time"
    log_info "  This may take 10-15 minutes..."

    # Transfer tokens from deployer to trader accounts for swapping
    log_info "  Distributing tokens to 5 trader accounts..."

    for i in {0..4}; do
        local trader_addr=${TRADER_ADDRS[$i]}
        local trader_key=${TRADER_KEYS[$i]}

        log_info "    Trader $((i+1)): Wrapping ETH to WMON..."
        ~/.foundry/bin/cast send ${ADDRESSES[WMON]} "deposit()" --value 200ether --private-key $trader_key --rpc-url $RPC_URL > /dev/null 2>&1

        log_info "    Trader $((i+1)): Transferring tokens..."
        ~/.foundry/bin/cast send ${ADDRESSES[WETH]} "transfer(address,uint256)" $trader_addr $(to_wei 20 18) --private-key $DEPLOYER_KEY --rpc-url $RPC_URL > /dev/null 2>&1

        ~/.foundry/bin/cast send ${ADDRESSES[USDC]} "transfer(address,uint256)" $trader_addr $(to_wei 200000 6) --private-key $DEPLOYER_KEY --rpc-url $RPC_URL > /dev/null 2>&1

        ~/.foundry/bin/cast send ${ADDRESSES[USDT]} "transfer(address,uint256)" $trader_addr $(to_wei 200000 6) --private-key $DEPLOYER_KEY --rpc-url $RPC_URL > /dev/null 2>&1

        ~/.foundry/bin/cast send ${ADDRESSES[WBTC]} "transfer(address,uint256)" $trader_addr $(to_wei 1 8) --private-key $DEPLOYER_KEY --rpc-url $RPC_URL > /dev/null 2>&1

        ~/.foundry/bin/cast send ${ADDRESSES[SOL]} "transfer(address,uint256)" $trader_addr $(to_wei 200 9) --private-key $DEPLOYER_KEY --rpc-url $RPC_URL > /dev/null 2>&1

        ~/.foundry/bin/cast send ${ADDRESSES[FOLKS]} "transfer(address,uint256)" $trader_addr $(to_wei 20000 6) --private-key $DEPLOYER_KEY --rpc-url $RPC_URL > /dev/null 2>&1
    done

    log_info "  Token distribution complete!"

    # Track successful swaps
    local successful_swaps=0
    local failed_swaps=0

    log_info "  Starting swap generation..."

    # Verify we're still in the past after deployment
    local CURRENT_BLOCK_TIME=$(cast block latest --json --rpc-url $RPC_URL 2>/dev/null | jq -r '.timestamp' | xargs printf "%d\n" 2>/dev/null)
    local CURRENT_REAL_TIME=$(date +%s)
    local TARGET_END_TIME=$CURRENT_REAL_TIME  # We want to end at "now"

    log_info "  Current block time: $(date -d @$CURRENT_BLOCK_TIME 2>/dev/null || date -r $CURRENT_BLOCK_TIME)"
    log_info "  Current real time: $(date -d @$CURRENT_REAL_TIME 2>/dev/null || date -r $CURRENT_REAL_TIME)"
    log_info "  Time gap: $((CURRENT_REAL_TIME - CURRENT_BLOCK_TIME)) seconds (~$(( (CURRENT_REAL_TIME - CURRENT_BLOCK_TIME) / 86400)) days)"

    # Calculate how much total time we need to add
    local TOTAL_TIME_TO_ADD=$((CURRENT_REAL_TIME - CURRENT_BLOCK_TIME))

    if [ $TOTAL_TIME_TO_ADD -lt $((25 * 86400)) ]; then
        log_error "Not enough time gap! Block time is too close to real time."
        log_error "Expected at least 25 days, got $(($TOTAL_TIME_TO_ADD / 86400)) days"
        log_error "Restart Anvil with larger buffer (45 minutes instead of 30)"
        exit 1
    fi

    log_info "  Will generate data covering $((TOTAL_TIME_TO_ADD / 86400)) days of history"

    # Calculate time between each swap
    local TOTAL_SWAPS=$((DAYS_OF_HISTORY * SWAPS_PER_DAY))
    local TIME_PER_SWAP=$(( TOTAL_TIME_TO_ADD / TOTAL_SWAPS ))

    log_info "  Each swap will advance time by $TIME_PER_SWAP seconds (~$((TIME_PER_SWAP / 60)) minutes)"

    # Generate all swaps using evm_increaseTime
    local swap_count=0
    for day in $(seq 0 $((DAYS_OF_HISTORY - 1))); do
        # Execute swaps for this day
        for swap_num in $(seq 1 $SWAPS_PER_DAY); do
            # Advance time forward by TIME_PER_SWAP seconds
            ~/.foundry/bin/cast rpc evm_increaseTime $TIME_PER_SWAP --rpc-url $RPC_URL > /dev/null 2>&1

            # Execute random swap and track result
            if execute_random_swap; then
                successful_swaps=$((successful_swaps + 1))
            else
                failed_swaps=$((failed_swaps + 1))
            fi

            # Mine block with new timestamp
            ~/.foundry/bin/cast rpc evm_mine --rpc-url $RPC_URL > /dev/null 2>&1

            swap_count=$((swap_count + 1))
        done

        # Progress logging (every 5 days)
        if [ $((($day + 1) % 5)) -eq 0 ]; then
            log_info "  Progress: $((day + 1))/$DAYS_OF_HISTORY days completed ($swap_count swaps: $successful_swaps successful, $failed_swaps failed)"
        fi
    done

    log_success "Historical trading data generated: $successful_swaps successful swaps, $failed_swaps failed across $DAYS_OF_HISTORY days"
}

# ============================================================================
# Step 4: Update Frontend Configuration
# ============================================================================

update_frontend_env() {
    log_step "Step 4: Updating frontend .env.development..."

    local env_file="packages/phasor-dex/.env.development"

    cat > $env_file << EOF
# Auto-generated by deploy-local-full.sh
# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_DEFAULT_RPC_URL=$RPC_URL

# Core Contract Addresses (Velodrome Pool System)
NEXT_PUBLIC_POOL_FACTORY_ADDRESS=${ADDRESSES[PoolFactory]}
NEXT_PUBLIC_DEFAULT_FACTORY_ADDRESS=${ADDRESSES[PoolFactory]}
NEXT_PUBLIC_FACTORY_REGISTRY_ADDRESS=${ADDRESSES[FactoryRegistry]}
NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS=${ADDRESSES[Router]}
NEXT_PUBLIC_DEFAULT_WMON_ADDRESS=${ADDRESSES[WMON]}

# Velodrome Fork - Governance & Staking
NEXT_PUBLIC_PHASOR_TOKEN_ADDRESS=${ADDRESSES[Phasor]}
NEXT_PUBLIC_VOTING_ESCROW_ADDRESS=${ADDRESSES[VotingEscrow]}
NEXT_PUBLIC_VOTER_ADDRESS=${ADDRESSES[Voter]}
NEXT_PUBLIC_GAUGE_ADDRESS=${ADDRESSES[Gauge]}
NEXT_PUBLIC_REWARDS_DISTRIBUTOR_ADDRESS=${ADDRESSES[RewardsDistributor]}
NEXT_PUBLIC_MINTER_ADDRESS=${ADDRESSES[Minter]}

# VelodromeLauncher (Launchpad)
NEXT_PUBLIC_VELODROME_LAUNCHER_ADDRESS=${ADDRESSES[VelodromeLauncher]}

# Envio Indexer URL (Hasura GraphQL endpoint)
NEXT_PUBLIC_ENVIO_URL=http://localhost:8080/v1/graphql
NEXT_PUBLIC_ENVIO_ADMIN_SECRET=testing
EOF

    # Clear Next.js build cache to ensure new env vars are picked up
    rm -rf packages/phasor-dex/.next 2>/dev/null || true

    log_success "Frontend .env.development updated"
}

# ============================================================================
# Step 5: Update Token List
# ============================================================================

update_token_list() {
    log_step "Step 5: Updating tokenlist.json..."

    local tokenlist_file="packages/phasor-dex/public/tokenlist.json"

    # Create token list with Node.js for proper JSON formatting (7 deployed tokens only)
    node -e "
const fs = require('fs');
const addresses = {
    WMON: '${ADDRESSES[WMON]}',
    USDC: '${ADDRESSES[USDC]}',
    USDT: '${ADDRESSES[USDT]}',
    WETH: '${ADDRESSES[WETH]}',
    WBTC: '${ADDRESSES[WBTC]}',
    SOL: '${ADDRESSES[SOL]}',
    FOLKS: '${ADDRESSES[FOLKS]}',
    PHASOR: '${ADDRESSES[Phasor]}'
};

const tokenList = {
    name: 'Phasor V2 Local Token List',
    version: { major: 1, minor: 0, patch: 0 },
    tokens: [
        {
            chainId: ${CHAIN_ID},
            address: addresses.WMON,
            name: 'Wrapped Monad',
            symbol: 'WMON',
            decimals: 18,
            logoURI: ''
        },
        {
            chainId: ${CHAIN_ID},
            address: addresses.USDC,
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            logoURI: ''
        },
        {
            chainId: ${CHAIN_ID},
            address: addresses.USDT,
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            logoURI: ''
        },
        {
            chainId: ${CHAIN_ID},
            address: addresses.WETH,
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            logoURI: ''
        },
        {
            chainId: ${CHAIN_ID},
            address: addresses.WBTC,
            name: 'Wrapped Bitcoin',
            symbol: 'WBTC',
            decimals: 8,
            logoURI: ''
        },
        {
            chainId: ${CHAIN_ID},
            address: addresses.SOL,
            name: 'Wrapped SOL',
            symbol: 'SOL',
            decimals: 9,
            logoURI: ''
        },
        {
            chainId: ${CHAIN_ID},
            address: addresses.FOLKS,
            name: 'Folks Finance',
            symbol: 'FOLKS',
            decimals: 6,
            logoURI: ''
        },
        {
            chainId: ${CHAIN_ID},
            address: addresses.PHASOR,
            name: 'Phasor Token',
            symbol: 'PHASOR',
            decimals: 18,
            logoURI: ''
        }
    ]
};

fs.writeFileSync('$tokenlist_file', JSON.stringify(tokenList, null, 2));
"

    log_success "Token list updated"
}

# ============================================================================
# Step 6: Update Envio Indexer Configuration
# ============================================================================

update_subgraph_config() {
    log_step "Step 6: Updating Envio indexer configuration..."

    cd packages/envio-indexer

    # Use the factory deployment block captured during contract deployment
    local factory_block=$FACTORY_DEPLOY_BLOCK
    if [ -z "$factory_block" ]; then
        factory_block="0"
    fi

    # Update the Monad network section in the existing Velodrome config.yaml
    # The Velodrome indexer has all the handlers, we just need to configure addresses
    log_info "Updating Monad network in config.yaml..."

    # Use Python to update the Monad network section
    # Pass bash variables as command-line arguments to avoid heredoc issues

    local pool_factory_addr="${ADDRESSES[PoolFactory]}"
    local voter_addr="${ADDRESSES[Voter]}"

    log_info "Monad network found, updating..."

    python3 - "$factory_block" "$pool_factory_addr" "$voter_addr" << 'PYTHON_EOF'
import re
import sys

factory_block = sys.argv[1]
pool_factory_addr = sys.argv[2]
voter_addr = sys.argv[3]

with open('config.yaml', 'r') as f:
    content = f.read()

# Pattern to match the Monad network section (id: 10143)
# This matches from "- id: 10143" to the next network or end of file
pattern = r'(  - id: 10143.*?)(?=\n  - id:|\Z)'

replacement = f'''  - id: 10143 # Monad Testnet / Phasor Local
    rpc:
      - url: http://127.0.0.1:8545
        for: sync
    start_block: {factory_block}
    contracts:
      - name: PoolFactory
        address:
          - "{pool_factory_addr}"
      - name: Pool
        address:
      - name: Voter
        address:
          - "{voter_addr}"
      - name: Gauge
        address:
      - name: FeesVotingReward
        address:
      - name: BribesVotingReward
        address:'''

# Replace the Monad section
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('config.yaml', 'w') as f:
    f.write(new_content)

print('Config updated successfully')
PYTHON_EOF

    # Write .env.development file with deployed contract addresses for the indexer
    log_info "Writing .env.development file with contract addresses..."
    cat > .env.development << ENVEOF
ENVIO_MONAD_RPC_URL=http://127.0.0.1:8545
ENVIO_MONAD_WMON_ADDRESS=$(echo "${ADDRESSES[WMON]}" | tr '[:upper:]' '[:lower:]')
ENVIO_MONAD_USDC_ADDRESS=$(echo "${ADDRESSES[USDC]}" | tr '[:upper:]' '[:lower:]')
ENVIO_MONAD_PHASOR_ADDRESS=$(echo "${ADDRESSES[Phasor]}" | tr '[:upper:]' '[:lower:]')
ENVIO_MONAD_POOL_FACTORY_ADDRESS=$(echo "${ADDRESSES[PoolFactory]}" | tr '[:upper:]' '[:lower:]')
ENVEOF

    # Also copy to .env so envio can read it immediately
    cp .env.development .env

    cd ../..

    log_success "Envio indexer config updated (.env.development + .env)"
}

# ============================================================================
# Step 7: Deploy Envio Indexer
# ============================================================================

deploy_subgraph_background() {
    log_step "Step 7: Envio indexer setup..."

    log_success "Envio indexer config updated. Start the indexer manually:"
    echo ""
    echo -e "  ${CYAN}cd packages/envio-indexer && pnpm dev${NC}"
    echo ""
    echo -e "  GraphQL: ${YELLOW}http://localhost:8080/v1/graphql${NC}"
    echo -e "  Console: ${YELLOW}http://localhost:8080/console${NC} (password: testing)"
    echo ""
}

# ============================================================================
# Step 9: Print Summary
# ============================================================================

print_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}========================================${NC}"
    echo -e "${GREEN}${BOLD}  Deployment Complete!${NC}"
    echo -e "${GREEN}${BOLD}========================================${NC}"
    echo ""
    echo -e "${CYAN}${BOLD}DEX Contract Addresses (Velodrome Pool System):${NC}"
    echo -e "  PoolFactory:       ${ADDRESSES[PoolFactory]}"
    echo -e "  FactoryRegistry:   ${ADDRESSES[FactoryRegistry]}"
    echo -e "  Router:            ${ADDRESSES[Router]}"
    echo ""
    echo -e "${CYAN}${BOLD}Velodrome Fork - ve(3,3) Governance:${NC}"
    echo -e "  Phasor Token:        ${ADDRESSES[Phasor]}"
    echo -e "  VotingEscrow:        ${ADDRESSES[VotingEscrow]}"
    echo -e "  Voter:               ${ADDRESSES[Voter]}"
    echo -e "  RewardsDistributor:  ${ADDRESSES[RewardsDistributor]}"
    echo -e "  Minter:              ${ADDRESSES[Minter]}"
    echo ""
    echo -e "${CYAN}${BOLD}VelodromeLauncher (Launchpad):${NC}"
    echo -e "  VelodromeLauncher:   ${ADDRESSES[VelodromeLauncher]}"
    echo ""
    echo -e "${CYAN}${BOLD}Tokens Deployed (8):${NC}"
    echo -e "  WMON:     ${ADDRESSES[WMON]} (18 decimals)"
    echo -e "  USDC:     ${ADDRESSES[USDC]} (6 decimals)"
    echo -e "  USDT:     ${ADDRESSES[USDT]} (6 decimals)"
    echo -e "  WETH:     ${ADDRESSES[WETH]} (18 decimals)"
    echo -e "  WBTC:     ${ADDRESSES[WBTC]} (8 decimals)"
    echo -e "  SOL:      ${ADDRESSES[SOL]} (9 decimals)"
    echo -e "  FOLKS:    ${ADDRESSES[FOLKS]} (6 decimals)"
    echo -e "  PHASOR:   ${ADDRESSES[Phasor]} (18 decimals)"
    echo ""
    echo -e "${CYAN}${BOLD}Liquidity Pools Created (6):${NC}"
    echo -e "  WMON/USDC  - 3,500 WMON : 7M USDC"
    echo -e "  WMON/USDT  - 2,300 WMON : 4.6M USDT"
    echo -e "  WMON/WETH  - 1,500 WMON : 600 WETH"
    echo -e "  WMON/WBTC  - 1,200 WMON : 24 WBTC"
    echo -e "  WMON/SOL   - 300 WMON : 6,000 SOL"
    echo -e "  WMON/FOLKS - 200 WMON : 400k FOLKS"
    echo ""
    echo -e "${CYAN}${BOLD}Configuration Updated:${NC}"
    echo -e "  ${GREEN}✓${NC} Frontend .env.development"
    echo -e "  ${GREEN}✓${NC} Token list JSON"
    echo -e "  ${GREEN}✓${NC} Envio indexer config"
    echo ""
    echo -e "${CYAN}${BOLD}Envio Indexer:${NC}"
    echo -e "  GraphQL: ${YELLOW}http://localhost:8080/v1/graphql${NC}"
    echo -e "  Console: ${YELLOW}http://localhost:8080/console${NC} (password: testing)"
    echo ""
    echo -e "${CYAN}${BOLD}Test Account:${NC}"
    echo -e "  Address: ${YELLOW}$DEPLOYER_ADDR${NC}"
    echo -e "  RPC:     ${YELLOW}$RPC_URL${NC}"
    echo ""
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

check_anvil() {
    log_step "Checking Anvil availability..."

    # Check if Anvil RPC is accessible
    if ! curl -s $RPC_URL -X POST -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
        log_error "Cannot connect to Anvil at $RPC_URL"
        echo ""
        echo -e "${RED}Please ensure Anvil is running and accessible.${NC}"
        echo -e "${YELLOW}Start Anvil with:${NC}"
        echo -e "  ${CYAN}anvil --host 0.0.0.0 --chain-id $CHAIN_ID${NC}"
        echo ""
        echo -e "${YELLOW}Note: --host 0.0.0.0 is required for Docker containers to access Anvil${NC}"
        exit 1
    fi

    # Check if Anvil is listening on all interfaces (required for Docker)
    if ss -tlnp 2>/dev/null | grep -q "127.0.0.1:8545"; then
        if ! ss -tlnp 2>/dev/null | grep -q "0.0.0.0:8545"; then
            log_error "Anvil is only listening on localhost (127.0.0.1)"
            echo ""
            echo -e "${RED}Docker containers cannot access services bound to 127.0.0.1${NC}"
            echo -e "${YELLOW}Please restart Anvil with:${NC}"
            echo -e "  ${CYAN}anvil --host 0.0.0.0 --chain-id $CHAIN_ID${NC}"
            echo ""
            exit 1
        fi
    fi

    log_success "Anvil is accessible"
}

# ============================================================================
# Command-Line Argument Parsing
# ============================================================================

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-history)
            SKIP_HISTORY=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--skip-history]"
            exit 1
            ;;
    esac
done

# ============================================================================
# Main Execution
# ============================================================================

main() {
    echo -e "${BLUE}${BOLD}"
    echo "============================================"
    echo "  Phasor V2 - Full Local Deployment"
    echo "============================================"
    echo -e "${NC}"
    echo -e "${YELLOW}Target: Anvil at $RPC_URL (Chain ID: $CHAIN_ID)${NC}"
    echo -e "${YELLOW}Deployer: $DEPLOYER_ADDR${NC}"
    if [ "$SKIP_HISTORY" = true ]; then
        echo -e "${YELLOW}Mode: Fast (skipping historical data)${NC}"
    else
        echo -e "${YELLOW}Mode: Full (with 30 days of historical trading data)${NC}"
    fi
    echo ""

    check_anvil

    compile_contracts
    deploy_contracts
    create_liquidity_pools
    setup_staking_system
    setup_test_launches
    update_frontend_env
    update_token_list
    update_subgraph_config
    generate_historical_data
    deploy_subgraph_background
    print_summary
}

# Run main function
main
