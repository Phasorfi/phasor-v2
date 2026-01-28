#!/bin/bash
set -e

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
    ["SOL"]=9 ["FOLKS"]=6
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

    forge build packages/

    log_success "Contracts compiled successfully"
}

# ============================================================================
# Step 2: Calculate and Update INIT_CODE_HASH
# ============================================================================

calculate_and_update_hash() {
    log_step "Step 2: Calculating INIT_CODE_HASH..."

    # Use the TypeScript script to calculate and update the hash
    npx tsx script/calculateInitHash.ts

    # Recompile with updated hash
    log_info "Recompiling with updated hash..."
    forge build packages/

    log_success "INIT_CODE_HASH updated and contracts recompiled"
}

# ============================================================================
# Step 3: Deploy Contracts with Cannon
# ============================================================================

deploy_contracts() {
    log_step "Step 3: Deploying contracts with Cannon..."

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
    ADDRESSES["Factory"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.UniswapV2Factory\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["Router"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.UniswapV2Router\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')

    # Get the current block number (factory was just deployed)
    FACTORY_DEPLOY_BLOCK=$(cast block latest --rpc-url $RPC_URL 2>/dev/null | grep -oP 'number\s+\K\d+')

    log_success "Contracts deployed successfully"
    log_info "Factory: ${ADDRESSES[Factory]}"
    log_info "Router: ${ADDRESSES[Router]}"
    log_info "WMON: ${ADDRESSES[WMON]}"
    log_info "Deployment block: $FACTORY_DEPLOY_BLOCK"
}

# ============================================================================
# Step 4: Create Liquidity Pools
# ============================================================================

create_liquidity_pools() {
    log_step "Step 4: Creating liquidity pools..."

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
            cast send $token0 "deposit()" \
                --private-key $DEPLOYER_KEY \
                --rpc-url $RPC_URL \
                --value ${amount0_wei} || {
                    log_error "Failed to deposit ${amount0} ETH to WMON"
                    return 1
                }
        fi

        if [ "$token1_name" = "WMON" ]; then
            log_info "  Depositing ${amount1} ETH to WMON..."
            cast send $token1 "deposit()" \
                --private-key $DEPLOYER_KEY \
                --rpc-url $RPC_URL \
                --value ${amount1_wei} || {
                    log_error "Failed to deposit ${amount1} ETH to WMON"
                    return 1
                }
        fi

        if [ "$token1_name" = "WETH" ]; then
            log_info "  Depositing ${amount1} ETH to WETH..."
            cast send $token1 "deposit()" \
                --private-key $DEPLOYER_KEY \
                --rpc-url $RPC_URL \
                --value ${amount1_wei} || {
                    log_error "Failed to deposit ${amount1} ETH to WETH"
                    return 1
                }
        fi

        # Approve tokens
        log_info "  Approving $token0_name..."
        cast send $token0 "approve(address,uint256)" $router $amount0_wei \
            --private-key $DEPLOYER_KEY \
            --rpc-url $RPC_URL || {
                log_error "Failed to approve $token0_name"
                return 1
            }

        log_info "  Approving $token1_name..."
        cast send $token1 "approve(address,uint256)" $router $amount1_wei \
            --private-key $DEPLOYER_KEY \
            --rpc-url $RPC_URL || {
                log_error "Failed to approve $token1_name"
                return 1
            }

        # Add liquidity
        log_info "  Adding liquidity to router..."
        cast send $router \
            "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)" \
            $token0 \
            $token1 \
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
    log_info "Capturing stable pair addresses for subgraph..."
    PAIR_WMON_USDC=$(cast call ${ADDRESSES[Factory]} "getPair(address,address)(address)" ${ADDRESSES[WMON]} ${ADDRESSES[USDC]} --rpc-url $RPC_URL | tr '[:upper:]' '[:lower:]')
    PAIR_WMON_USDT=$(cast call ${ADDRESSES[Factory]} "getPair(address,address)(address)" ${ADDRESSES[WMON]} ${ADDRESSES[USDT]} --rpc-url $RPC_URL | tr '[:upper:]' '[:lower:]')
    log_info "  WMON-USDC pair: $PAIR_WMON_USDC"
    log_info "  WMON-USDT pair: $PAIR_WMON_USDT"
}

# ============================================================================
# Step 4.5: Generate Historical Trading Data
# ============================================================================

# Execute a swap on the router
execute_swap_on_router() {
    local token_in=$1
    local token_out=$2
    local amount_in=$3
    local trader_key=$4
    local trader_addr=$5

    # Approve token_in for this swap (do it each time to avoid balance issues)
    cast send ${ADDRESSES[$token_in]} \
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
    cast send ${ADDRESSES[Router]} \
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)" \
        $amount_in \
        $amount_out_min \
        "[${ADDRESSES[$token_in]},${ADDRESSES[$token_out]}]" \
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

    log_step "Step 4.5: Generating historical trading data..."

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

        log_info "    Trader $((i+1)): Wrapping ETH to WMON and WETH..."
        cast send ${ADDRESSES[WMON]} "deposit()" --value 200ether --private-key $trader_key --rpc-url $RPC_URL > /dev/null 2>&1

        cast send ${ADDRESSES[WETH]} "deposit()" --value 20ether --private-key $trader_key --rpc-url $RPC_URL > /dev/null 2>&1

        log_info "    Trader $((i+1)): Transferring tokens..."
        cast send ${ADDRESSES[USDC]} "transfer(address,uint256)" $trader_addr $(to_wei 200000 6) --private-key $DEPLOYER_KEY --rpc-url $RPC_URL > /dev/null 2>&1

        cast send ${ADDRESSES[USDT]} "transfer(address,uint256)" $trader_addr $(to_wei 200000 6) --private-key $DEPLOYER_KEY --rpc-url $RPC_URL > /dev/null 2>&1

        cast send ${ADDRESSES[WBTC]} "transfer(address,uint256)" $trader_addr $(to_wei 1 8) --private-key $DEPLOYER_KEY --rpc-url $RPC_URL > /dev/null 2>&1

        cast send ${ADDRESSES[SOL]} "transfer(address,uint256)" $trader_addr $(to_wei 200 9) --private-key $DEPLOYER_KEY --rpc-url $RPC_URL > /dev/null 2>&1

        cast send ${ADDRESSES[FOLKS]} "transfer(address,uint256)" $trader_addr $(to_wei 20000 6) --private-key $DEPLOYER_KEY --rpc-url $RPC_URL > /dev/null 2>&1
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
            cast rpc evm_increaseTime $TIME_PER_SWAP --rpc-url $RPC_URL > /dev/null 2>&1

            # Execute random swap and track result
            if execute_random_swap; then
                successful_swaps=$((successful_swaps + 1))
            else
                failed_swaps=$((failed_swaps + 1))
            fi

            # Mine block with new timestamp
            cast rpc evm_mine --rpc-url $RPC_URL > /dev/null 2>&1

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
# Step 5: Update Frontend Configuration
# ============================================================================

update_frontend_env() {
    log_step "Step 5: Updating frontend .env.local..."

    local env_file="packages/phasor-dex/.env.local"

    cat > $env_file << EOF
# Auto-generated by deploy-local-full.sh
# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_DEFAULT_RPC_URL=$RPC_URL

# Core Contract Addresses
NEXT_PUBLIC_DEFAULT_FACTORY_ADDRESS=${ADDRESSES[Factory]}
NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS=${ADDRESSES[Router]}
NEXT_PUBLIC_DEFAULT_WMON_ADDRESS=${ADDRESSES[WMON]}

# Subgraph URLs
NEXT_PUBLIC_SUBGRAPH_URL=http://127.0.0.1:8000/subgraphs/name/phasor-v2
NEXT_PUBLIC_TOKENS_SUBGRAPH_URL=http://127.0.0.1:8000/subgraphs/name/phasor-v2-tokens
EOF

    # Clear Next.js build cache to ensure new env vars are picked up
    rm -rf packages/phasor-dex/.next 2>/dev/null || true

    log_success "Frontend .env.local updated"
}

# ============================================================================
# Step 6: Update Token List
# ============================================================================

update_token_list() {
    log_step "Step 6: Updating tokenlist.json..."

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
    FOLKS: '${ADDRESSES[FOLKS]}'
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
        }
    ]
};

fs.writeFileSync('$tokenlist_file', JSON.stringify(tokenList, null, 2));
"

    log_success "Token list updated"
}

# ============================================================================
# Step 7: Update Subgraph Configuration
# ============================================================================

update_subgraph_config() {
    log_step "Step 7: Updating subgraph configurations..."

    # Update local chain config for local deployment (preserves monad-testnet config)
    local chain_config="packages/v2-subgraph/config/local/chain.ts"
    cat > $chain_config << EOF
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts/index'

// Monad Testnet - Factory address
export const FACTORY_ADDRESS = '${ADDRESSES[Factory],,}'

// WMON (Wrapped MON) - Reference token for pricing
export const REFERENCE_TOKEN = '${ADDRESSES[WMON],,}'

// Stable token pairs for USD pricing (WMON-USDC, WMON-USDT)
// These pairs are used to calculate Bundle.ethPrice for USD pricing
export const STABLE_TOKEN_PAIRS: string[] = [
  '${PAIR_WMON_USDC}', // WMON-USDC
  '${PAIR_WMON_USDT}', // WMON-USDT
]

// Token whitelist - from tokenlist.json
// Tokens that should contribute to tracked volume and liquidity
export const WHITELIST: string[] = [
  '${ADDRESSES[WMON],,}', // WMON - Wrapped Monad
  '${ADDRESSES[USDC],,}', // USDC
  '${ADDRESSES[USDT],,}', // USDT
  '${ADDRESSES[WBTC],,}', // WBTC
  '${ADDRESSES[WETH],,}', // WETH
  '${ADDRESSES[SOL],,}', // SOL
  '${ADDRESSES[FOLKS],,}', // FOLKS
]

// Stablecoins for USD pricing
export const STABLECOINS = [
  '${ADDRESSES[USDC],,}', // USDC
  '${ADDRESSES[USDT],,}', // USDT
]

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
export const MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('10000')

// minimum liquidity for price to get tracked
export const MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('100000')

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString('${ADDRESSES[WMON],,}'),
    symbol: 'WMON',
    name: 'Wrapped Monad',
    decimals: BigInt.fromI32(18),
  },
]

export const SKIP_TOTAL_SUPPLY: string[] = []
EOF

    log_success "Subgraph chain config updated (local)"
}

# ============================================================================
# Step 8: Deploy Subgraphs (Background)
# ============================================================================

deploy_subgraph_background() {
    log_step "Step 8: Deploying subgraphs..."

    cd packages/v2-subgraph

    # Use the factory deployment block captured during contract deployment
    local factory_block=$FACTORY_DEPLOY_BLOCK

    if [ -z "$factory_block" ]; then
        log_error "Factory deployment block not set"
        factory_block="1"
        log_info "Using default startBlock: $factory_block"
    else
        log_info "Using factory deployment block: $factory_block"
    fi

    # Update local config.json which is used by mustache to generate the YAML manifests
    # Note: network is still "monad-testnet" to match graph-node's ethereum setting
    log_info "Updating local config.json with factory address and startBlock..."
    cat > config/local/config.json << EOF
{
  "network": "monad-testnet",
  "factory": "${ADDRESSES[Factory]}",
  "startblock": "$factory_block"
}
EOF

    # WIPE graph-node database to handle genesis hash changes when Anvil restarts
    # This prevents "chain is defective" errors when the genesis hash changes
    log_info "Wiping graph-node database for fresh sync..."
    docker-compose down > /dev/null 2>&1 || true
    # Use Docker to remove data directories (they're owned by Docker users)
    docker run --rm -v "$(pwd)/data:/data" alpine sh -c "rm -rf /data/postgres /data/ipfs && mkdir -p /data/postgres /data/ipfs" > /dev/null 2>&1 || {
        # Fallback: try direct removal (may need sudo on some systems)
        rm -rf data/postgres data/ipfs 2>/dev/null || true
        mkdir -p data/postgres data/ipfs
    }

    # Start all graph-node services fresh
    log_info "Starting graph-node with local Anvil RPC..."
    MONAD_RPC_URL= docker-compose up -d > /dev/null 2>&1

    # Wait for graph-node to be ready
    log_info "Waiting for graph-node to be ready..."
    for i in {1..30}; do
        if curl -s http://127.0.0.1:8020 > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done

    if ! curl -s http://127.0.0.1:8020 > /dev/null 2>&1; then
        log_error "Graph node failed to start"
        cd ../..
        return
    fi

    log_success "Graph-node ready"

    # Deploy V2 subgraph
    log_info "Building and deploying V2 subgraph..."
    yarn build --network local --subgraph-type v2 > /dev/null 2>&1
    yarn graph create --node http://127.0.0.1:8020/ phasor-v2 > /dev/null 2>&1 || true
    yarn graph deploy --node http://127.0.0.1:8020/ --ipfs http://127.0.0.1:5001 phasor-v2 v2-subgraph.yaml --version-label v$(date +%s) > /dev/null 2>&1
    log_success "V2 subgraph deployed"

    # Deploy V2-Tokens subgraph
    log_info "Building and deploying V2-Tokens subgraph..."
    yarn build --network local --subgraph-type v2-tokens > /dev/null 2>&1
    yarn graph create --node http://127.0.0.1:8020/ phasor-v2-tokens > /dev/null 2>&1 || true
    yarn graph deploy --node http://127.0.0.1:8020/ --ipfs http://127.0.0.1:5001 phasor-v2-tokens v2-tokens-subgraph.yaml --version-label v$(date +%s) > /dev/null 2>&1
    log_success "V2-Tokens subgraph deployed"

    cd ../..

    log_info "Subgraphs available at:"
    log_info "  V2: http://127.0.0.1:8000/subgraphs/name/phasor-v2"
    log_info "  Tokens: http://127.0.0.1:8000/subgraphs/name/phasor-v2-tokens"
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
    echo -e "${CYAN}${BOLD}Contract Addresses:${NC}"
    echo -e "  Factory:  ${ADDRESSES[Factory]}"
    echo -e "  Router:   ${ADDRESSES[Router]}"
    echo ""
    echo -e "${CYAN}${BOLD}Tokens Deployed (7):${NC}"
    echo -e "  WMON:     ${ADDRESSES[WMON]} (18 decimals)"
    echo -e "  USDC:     ${ADDRESSES[USDC]} (6 decimals)"
    echo -e "  USDT:     ${ADDRESSES[USDT]} (6 decimals)"
    echo -e "  WETH:     ${ADDRESSES[WETH]} (18 decimals)"
    echo -e "  WBTC:     ${ADDRESSES[WBTC]} (8 decimals)"
    echo -e "  SOL:      ${ADDRESSES[SOL]} (9 decimals)"
    echo -e "  FOLKS:    ${ADDRESSES[FOLKS]} (6 decimals)"
    echo ""
    echo -e "${CYAN}${BOLD}Liquidity Pools Created (6):${NC}"
    echo -e "  WMON/USDC  - 100 WMON : 200,000 USDC"
    echo -e "  WMON/USDT  - 100 WMON : 200,000 USDT"
    echo -e "  WMON/WETH  - 100 WMON : 40 WETH"
    echo -e "  WMON/WBTC  - 100 WMON : 2 WBTC"
    echo -e "  WMON/SOL   - 20 WMON : 300 SOL"
    echo -e "  WMON/FOLKS - 20 WMON : 40,000 FOLKS"
    echo ""
    echo -e "${CYAN}${BOLD}Configuration Updated:${NC}"
    echo -e "  ${GREEN}✓${NC} Frontend .env.local"
    echo -e "  ${GREEN}✓${NC} Token list JSON"
    echo -e "  ${GREEN}✓${NC} Subgraph configs"
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
    calculate_and_update_hash
    deploy_contracts
    create_liquidity_pools
    update_frontend_env
    update_token_list
    update_subgraph_config
    deploy_subgraph_background

    # Wait for subgraph to start indexing before generating historical data
    if [ "$SKIP_HISTORY" != true ]; then
        log_info "Waiting 5 seconds for subgraph to initialize..."
        sleep 5
    fi

    generate_historical_data
    print_summary
}

# Run main function
main
