#!/bin/bash
set -e

# ============================================================================
# Phasor V2 - Testnet Deployment Script
# ============================================================================
# Deploys the full Phasor ecosystem to Monad testnet:
# - Core DEX (Factory, Router)
# - Velodrome Fork (Phasor, VotingEscrow, Voter, RewardsDistributor, Minter)
# - MISO Launchpad (MISOAccessControls, MISOMarket, MISOLauncher, Auction templates)
# - Transfers ownership to multisig
#
# Features:
# - Pre-flight checks (RPC, balance, dependencies)
# - Gas estimation before deployment
# - Verbose colored output
# - Post-deployment verification
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Default Configuration
DEFAULT_RPC_URL="https://testnet-rpc.monad.xyz"
DEFAULT_CHAIN_ID="10143"
DEFAULT_CANNONFILE="cannonfile.toml"
DEFAULT_MAX_GAS_PRICE="50"  # gwei

# Configuration (can be overridden by environment variables)
RPC_URL="${RPC_URL:-$DEFAULT_RPC_URL}"
CHAIN_ID="${CHAIN_ID:-$DEFAULT_CHAIN_ID}"
CANNONFILE="${CANNONFILE:-$DEFAULT_CANNONFILE}"
MAX_GAS_PRICE="${MAX_GAS_PRICE:-$DEFAULT_MAX_GAS_PRICE}"
DEPLOYER_PRIVATE_KEY="${DEPLOYER_PRIVATE_KEY:-}"

# Contract addresses (populated during deployment)
declare -A ADDRESSES

# ============================================================================
# Helper Functions
# ============================================================================

log_step() {
    echo -e "\n${CYAN}${BOLD}[$(date +%H:%M:%S)] $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

log_info() {
    echo -e "${BLUE}  $1${NC}"
}

confirm() {
    local prompt="$1"
    local default="${2:-n}"

    if [ "$default" = "y" ]; then
        prompt="$prompt [Y/n]: "
    else
        prompt="$prompt [y/N]: "
    fi

    read -p "$(echo -e "${YELLOW}$prompt${NC}")" response
    response=${response:-$default}

    case "$response" in
        [yY][eE][sS]|[yY]) return 0 ;;
        *) return 1 ;;
    esac
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

check_dependencies() {
    log_step "Checking dependencies..."

    local missing=0

    # Check forge
    if ! command -v forge &> /dev/null; then
        log_error "forge not found. Please install Foundry: https://getfoundry.sh"
        missing=1
    else
        log_success "forge $(forge --version | head -1 | cut -d' ' -f2)"
    fi

    # Check cast
    if ! command -v cast &> /dev/null; then
        log_error "cast not found. Please install Foundry: https://getfoundry.sh"
        missing=1
    else
        log_success "cast available"
    fi

    # Check cannon
    if ! npx @usecannon/cli --version &> /dev/null; then
        log_error "cannon not found. Installing..."
        npm install -g @usecannon/cli || {
            log_error "Failed to install cannon"
            missing=1
        }
    else
        log_success "cannon $(npx @usecannon/cli --version 2>/dev/null | head -1)"
    fi

    # Check node
    if ! command -v node &> /dev/null; then
        log_error "node not found. Please install Node.js"
        missing=1
    else
        log_success "node $(node --version)"
    fi

    # Check jq
    if ! command -v jq &> /dev/null; then
        log_error "jq not found. Please install jq"
        missing=1
    else
        log_success "jq available"
    fi

    # Check bc
    if ! command -v bc &> /dev/null; then
        log_error "bc not found. Please install bc"
        missing=1
    else
        log_success "bc available"
    fi

    if [ $missing -eq 1 ]; then
        log_error "Missing dependencies. Please install them and try again."
        exit 1
    fi

    log_success "All dependencies available"
}

check_cannonfile() {
    log_step "Checking cannonfile..."

    if [ ! -f "$CANNONFILE" ]; then
        log_error "Cannonfile not found: $CANNONFILE"
        exit 1
    fi

    log_success "Cannonfile found: $CANNONFILE"

    # Extract key addresses from cannonfile for display
    local deployer=$(grep -A 10 '\[var.main\]' $CANNONFILE | grep 'deployer' | head -1 | cut -d'"' -f2)
    local safe=$(grep -A 10 '\[var.main\]' $CANNONFILE | grep 'safe' | head -1 | cut -d'"' -f2)
    local wmon=$(grep -A 10 '\[var.main\]' $CANNONFILE | grep 'WMON' | head -1 | cut -d'"' -f2)

    log_info "Deployer: $deployer"
    log_info "Multisig: $safe"
    log_info "WMON:     $wmon"

    DEPLOYER_ADDR="$deployer"
    SAFE_ADDR="$safe"
    WMON_ADDR="$wmon"
}

check_rpc() {
    log_step "Checking RPC connectivity..."

    local response=$(curl -s -X POST "$RPC_URL" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' 2>/dev/null)

    if [ -z "$response" ]; then
        log_error "Cannot connect to RPC: $RPC_URL"
        exit 1
    fi

    local chain_id_hex=$(echo "$response" | jq -r '.result' 2>/dev/null)
    if [ -z "$chain_id_hex" ] || [ "$chain_id_hex" = "null" ]; then
        log_error "Invalid RPC response"
        exit 1
    fi

    local chain_id_dec=$((chain_id_hex))
    if [ "$chain_id_dec" != "$CHAIN_ID" ]; then
        log_warning "Chain ID mismatch: expected $CHAIN_ID, got $chain_id_dec"
        if ! confirm "Continue anyway?"; then
            exit 1
        fi
    fi

    log_success "RPC connected: $RPC_URL (Chain ID: $chain_id_dec)"
}

check_wmon() {
    log_step "Checking WMON contract..."

    local code=$(cast code "$WMON_ADDR" --rpc-url "$RPC_URL" 2>/dev/null)

    if [ -z "$code" ] || [ "$code" = "0x" ]; then
        log_error "WMON contract not found at $WMON_ADDR"
        log_info "Please verify the WMON address in $CANNONFILE"
        exit 1
    fi

    log_success "WMON contract exists at $WMON_ADDR"
}

check_deployer_key() {
    log_step "Checking deployer credentials..."

    if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
        echo -e "${YELLOW}Enter deployer private key (will not be displayed):${NC}"
        read -s DEPLOYER_PRIVATE_KEY
        echo ""

        if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
            log_error "Private key is required"
            exit 1
        fi
    fi

    # Verify key matches expected deployer
    local derived_addr=$(cast wallet address "$DEPLOYER_PRIVATE_KEY" 2>/dev/null)

    if [ -z "$derived_addr" ]; then
        log_error "Invalid private key format"
        exit 1
    fi

    # Case-insensitive comparison
    if [ "${derived_addr,,}" != "${DEPLOYER_ADDR,,}" ]; then
        log_warning "Key address ($derived_addr) doesn't match cannonfile deployer ($DEPLOYER_ADDR)"
        if ! confirm "Continue with this key?"; then
            exit 1
        fi
        DEPLOYER_ADDR="$derived_addr"
    fi

    log_success "Private key validated for: $DEPLOYER_ADDR"
}

check_deployer_balance() {
    log_step "Checking deployer balance..."

    local balance_wei=$(cast balance "$DEPLOYER_ADDR" --rpc-url "$RPC_URL" 2>/dev/null)
    local balance_eth=$(cast from-wei "$balance_wei" 2>/dev/null)

    log_info "Balance: $balance_eth MON"

    # Minimum recommended balance (0.5 MON for deployment + gas buffer)
    local min_balance="500000000000000000"  # 0.5 MON in wei

    if [ $(echo "$balance_wei < $min_balance" | bc) -eq 1 ]; then
        log_warning "Low balance! Recommended minimum: 0.5 MON"
        if ! confirm "Continue anyway?"; then
            exit 1
        fi
    fi

    log_success "Deployer balance sufficient"
}

# ============================================================================
# Gas Estimation
# ============================================================================

estimate_gas() {
    log_step "Estimating deployment gas costs..."

    # Approximate gas costs for each contract deployment
    # These are estimates based on typical deployment sizes
    declare -A GAS_ESTIMATES=(
        ["UniswapV2Factory"]=2500000
        ["UniswapV2Router02"]=4500000
        ["Phasor"]=1500000
        ["VotingEscrow"]=3500000
        ["Voter"]=2500000
        ["RewardsDistributor"]=2000000
        ["Minter"]=1500000
        ["MISOAccessControls"]=500000
        ["BoringFactory"]=1000000
        ["BatchAuction"]=3000000
        ["Crowdsale"]=2500000
        ["DutchAuction"]=2500000
        ["HyperbolicAuction"]=2500000
        ["PostAuctionLauncher"]=2000000
        ["MISOMarket"]=2000000
        ["MISOLauncher"]=1500000
    )

    # Invokes (initialization and configuration)
    declare -A INVOKE_ESTIMATES=(
        ["init_miso_access"]=50000
        ["init_miso_market"]=100000
        ["init_miso_launcher"]=50000
        ["add_launcher_template"]=50000
        ["set_art_proxy"]=50000
        ["set_ve_voter"]=50000
        ["set_phasor_minter"]=50000
        ["set_rewards_minter"]=50000
    )

    local total_gas=0

    echo ""
    echo -e "${CYAN}Contract Deployments:${NC}"
    printf "%-25s %15s\n" "Contract" "Est. Gas"
    echo "----------------------------------------"

    for contract in "${!GAS_ESTIMATES[@]}"; do
        printf "%-25s %15s\n" "$contract" "${GAS_ESTIMATES[$contract]}"
        total_gas=$((total_gas + GAS_ESTIMATES[$contract]))
    done

    echo ""
    echo -e "${CYAN}Ownership Transfers:${NC}"
    printf "%-25s %15s\n" "Transaction" "Est. Gas"
    echo "----------------------------------------"

    for invoke in "${!INVOKE_ESTIMATES[@]}"; do
        printf "%-25s %15s\n" "$invoke" "${INVOKE_ESTIMATES[$invoke]}"
        total_gas=$((total_gas + INVOKE_ESTIMATES[$invoke]))
    done

    echo ""
    echo "========================================"
    printf "%-25s %15s\n" "TOTAL ESTIMATED GAS:" "$total_gas"
    echo "========================================"

    # Get current gas price
    local gas_price_wei=$(cast gas-price --rpc-url "$RPC_URL" 2>/dev/null || echo "1000000000")
    local gas_price_gwei=$(echo "scale=2; $gas_price_wei / 1000000000" | bc)

    log_info "Current gas price: $gas_price_gwei gwei"

    # Check against max gas price
    if [ $(echo "$gas_price_gwei > $MAX_GAS_PRICE" | bc) -eq 1 ]; then
        log_warning "Gas price ($gas_price_gwei gwei) exceeds max ($MAX_GAS_PRICE gwei)"
        if ! confirm "Continue with current gas price?"; then
            exit 1
        fi
    fi

    # Calculate estimated cost
    local cost_wei=$(echo "$total_gas * $gas_price_wei" | bc)
    local cost_eth=$(echo "scale=6; $cost_wei / 1000000000000000000" | bc)

    echo ""
    log_info "Estimated deployment cost: ~$cost_eth MON (at $gas_price_gwei gwei)"
    echo ""

    if ! confirm "Proceed with deployment?"; then
        log_info "Deployment cancelled"
        exit 0
    fi
}

# ============================================================================
# Compilation
# ============================================================================

compile_contracts() {
    log_step "Compiling contracts..."

    forge build packages/ 2>&1 | while read line; do
        if [[ "$line" == *"Compiling"* ]]; then
            log_info "$line"
        elif [[ "$line" == *"error"* ]]; then
            log_error "$line"
        fi
    done

    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        log_error "Compilation failed"
        exit 1
    fi

    log_success "Contracts compiled successfully"
}

calculate_init_hash() {
    log_step "Calculating INIT_CODE_HASH..."

    # Use the TypeScript script to calculate and update the hash
    if [ -f "script/calculateInitHash.ts" ]; then
        npx tsx script/calculateInitHash.ts 2>&1 | while read line; do
            log_info "$line"
        done

        # Recompile with updated hash
        log_info "Recompiling with updated hash..."
        forge build packages/ > /dev/null 2>&1

        log_success "INIT_CODE_HASH updated"
    else
        log_warning "calculateInitHash.ts not found, skipping hash update"
    fi
}

# ============================================================================
# Deployment
# ============================================================================

deploy_contracts() {
    log_step "Deploying contracts with Cannon..."

    log_info "This may take several minutes..."
    echo ""

    # Create deployment log file
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local log_file="deployments/cannon-output-$timestamp.log"
    mkdir -p deployments

    # Deploy using Cannon
    local deploy_output=$(npx @usecannon/cli build "$CANNONFILE" \
        --private-key "$DEPLOYER_PRIVATE_KEY" \
        --rpc-url "$RPC_URL" \
        --chain-id "$CHAIN_ID" \
        2>&1 | tee "$log_file")

    if [ $? -ne 0 ]; then
        log_error "Deployment failed! Check logs: $log_file"
        exit 1
    fi

    # Extract addresses from deployment output
    log_info "Extracting contract addresses..."

    ADDRESSES["Factory"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.UniswapV2Factory\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["Router"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.UniswapV2Router\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')

    # Velodrome Fork Ecosystem
    ADDRESSES["Phasor"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.Phasor\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["VotingEscrow"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.VotingEscrow\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["Voter"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.Voter\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["RewardsDistributor"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.RewardsDistributor\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["Minter"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.Minter\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')

    # MISO Launchpad
    ADDRESSES["MISOAccessControls"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.MISOAccessControls\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["MISOMarket"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.MISOMarket\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["MISOLauncher"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.MISOLauncher\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')

    # Get deployment block
    DEPLOY_BLOCK=$(cast block latest --rpc-url "$RPC_URL" 2>/dev/null | grep -oP 'number\s+\K\d+' || echo "0")

    log_success "Contracts deployed successfully"
    log_info "Deployment log: $log_file"
}

# ============================================================================
# Verification
# ============================================================================

verify_deployment() {
    log_step "Verifying deployment..."

    local errors=0

    # Verify Factory feeToSetter is multisig
    local fee_to_setter=$(cast call "${ADDRESSES[Factory]}" "feeToSetter()(address)" --rpc-url "$RPC_URL" 2>/dev/null)
    if [ "${fee_to_setter,,}" = "${SAFE_ADDR,,}" ]; then
        log_success "Factory.feeToSetter = multisig ✓"
    else
        log_error "Factory.feeToSetter mismatch: expected $SAFE_ADDR, got $fee_to_setter"
        errors=1
    fi

    # Verify Minter is set correctly on Phasor token
    local phasor_minter=$(cast call "${ADDRESSES[Phasor]}" "minter()(address)" --rpc-url "$RPC_URL" 2>/dev/null)
    if [ "${phasor_minter,,}" = "${ADDRESSES[Minter],,}" ]; then
        log_success "Phasor.minter = Minter ✓"
    else
        log_error "Phasor.minter mismatch: expected ${ADDRESSES[Minter]}, got $phasor_minter"
        errors=1
    fi

    # Verify MISOAccessControls is initialized
    local miso_admin=$(cast call "${ADDRESSES[MISOAccessControls]}" "hasAdminRole(address)(bool)" "$SAFE_ADDR" --rpc-url "$RPC_URL" 2>/dev/null)
    if [ "$miso_admin" = "true" ]; then
        log_success "MISOAccessControls admin = multisig ✓"
    else
        log_warning "MISOAccessControls admin check failed (may need manual verification)"
    fi

    # Verify Router configuration
    local router_factory=$(cast call "${ADDRESSES[Router]}" "factory()(address)" --rpc-url "$RPC_URL" 2>/dev/null)
    local router_weth=$(cast call "${ADDRESSES[Router]}" "WETH()(address)" --rpc-url "$RPC_URL" 2>/dev/null)

    if [ "${router_factory,,}" = "${ADDRESSES[Factory],,}" ]; then
        log_success "Router.factory = Factory ✓"
    else
        log_error "Router.factory mismatch"
        errors=1
    fi

    if [ "${router_weth,,}" = "${WMON_ADDR,,}" ]; then
        log_success "Router.WETH = WMON ✓"
    else
        log_error "Router.WETH mismatch"
        errors=1
    fi

    if [ $errors -eq 0 ]; then
        log_success "All ownership verifications passed"
    else
        log_warning "Some verifications failed - please check manually"
    fi
}

# ============================================================================
# Configuration Updates
# ============================================================================

update_frontend_config() {
    log_step "Updating frontend configuration..."

    local env_file="packages/phasor-dex/.env.local"

    # Backup existing file
    if [ -f "$env_file" ]; then
        cp "$env_file" "${env_file}.backup-$(date +%Y%m%d_%H%M%S)"
    fi

    cat > "$env_file" << EOF
# Auto-generated by deploy-testnet.sh on $(date)
# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_DEFAULT_RPC_URL=$RPC_URL

# Core Contract Addresses
NEXT_PUBLIC_DEFAULT_FACTORY_ADDRESS=${ADDRESSES[Factory]}
NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS=${ADDRESSES[Router]}
NEXT_PUBLIC_DEFAULT_WMON_ADDRESS=$WMON_ADDR

# Velodrome Fork - Governance & Staking
NEXT_PUBLIC_PHASOR_TOKEN_ADDRESS=${ADDRESSES[Phasor]}
NEXT_PUBLIC_VOTING_ESCROW_ADDRESS=${ADDRESSES[VotingEscrow]}
NEXT_PUBLIC_VOTER_ADDRESS=${ADDRESSES[Voter]}
NEXT_PUBLIC_REWARDS_DISTRIBUTOR_ADDRESS=${ADDRESSES[RewardsDistributor]}
NEXT_PUBLIC_MINTER_ADDRESS=${ADDRESSES[Minter]}

# MISO Launchpad (SushiSwap Fork)
NEXT_PUBLIC_MISO_ACCESS_CONTROLS_ADDRESS=${ADDRESSES[MISOAccessControls]}
NEXT_PUBLIC_MISO_MARKET_ADDRESS=${ADDRESSES[MISOMarket]}
NEXT_PUBLIC_MISO_LAUNCHER_ADDRESS=${ADDRESSES[MISOLauncher]}

# Subgraph URLs (update after subgraph deployment)
# NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/<ID>/phasor-v2/version/latest
EOF

    log_success "Frontend .env.local updated"
}

update_subgraph_config() {
    log_step "Updating subgraph configuration..."

    local config_file="packages/v2-subgraph/config/monad-testnet/config.json"

    # Backup existing file
    if [ -f "$config_file" ]; then
        cp "$config_file" "${config_file}.backup-$(date +%Y%m%d_%H%M%S)"
    fi

    cat > "$config_file" << EOF
{
  "network": "monad-testnet",
  "factory": "${ADDRESSES[Factory]}",
  "startblock": "$DEPLOY_BLOCK"
}
EOF

    log_success "Subgraph config.json updated"
    log_warning "Remember to update chain.ts with token whitelist after creating pools!"
}

generate_deployment_manifest() {
    log_step "Generating deployment manifest..."

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local manifest_file="deployments/deployment-$timestamp.json"

    cat > "$manifest_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "network": {
    "chainId": $CHAIN_ID,
    "rpcUrl": "$RPC_URL"
  },
  "deployer": "$DEPLOYER_ADDR",
  "multisig": "$SAFE_ADDR",
  "deployBlock": $DEPLOY_BLOCK,
  "contracts": {
    "UniswapV2Factory": "${ADDRESSES[Factory]}",
    "UniswapV2Router02": "${ADDRESSES[Router]}",
    "WMON": "$WMON_ADDR",
    "Phasor": "${ADDRESSES[Phasor]}",
    "VotingEscrow": "${ADDRESSES[VotingEscrow]}",
    "Voter": "${ADDRESSES[Voter]}",
    "RewardsDistributor": "${ADDRESSES[RewardsDistributor]}",
    "Minter": "${ADDRESSES[Minter]}",
    "MISOAccessControls": "${ADDRESSES[MISOAccessControls]}",
    "MISOMarket": "${ADDRESSES[MISOMarket]}",
    "MISOLauncher": "${ADDRESSES[MISOLauncher]}"
  }
}
EOF

    log_success "Deployment manifest: $manifest_file"
}

# ============================================================================
# Summary
# ============================================================================

print_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}========================================${NC}"
    echo -e "${GREEN}${BOLD}  Deployment Complete!${NC}"
    echo -e "${GREEN}${BOLD}========================================${NC}"
    echo ""
    echo -e "${CYAN}${BOLD}Network:${NC}"
    echo -e "  Chain ID:  $CHAIN_ID"
    echo -e "  RPC URL:   $RPC_URL"
    echo -e "  Block:     $DEPLOY_BLOCK"
    echo ""
    echo -e "${CYAN}${BOLD}Core DEX:${NC}"
    echo -e "  Factory:   ${ADDRESSES[Factory]}"
    echo -e "  Router:    ${ADDRESSES[Router]}"
    echo -e "  WMON:      $WMON_ADDR"
    echo ""
    echo -e "${CYAN}${BOLD}Velodrome Fork - ve(3,3) Governance:${NC}"
    echo -e "  Phasor Token:        ${ADDRESSES[Phasor]}"
    echo -e "  VotingEscrow:        ${ADDRESSES[VotingEscrow]}"
    echo -e "  Voter:               ${ADDRESSES[Voter]}"
    echo -e "  RewardsDistributor:  ${ADDRESSES[RewardsDistributor]}"
    echo -e "  Minter:              ${ADDRESSES[Minter]}"
    echo ""
    echo -e "${CYAN}${BOLD}MISO Launchpad (SushiSwap Fork):${NC}"
    echo -e "  MISOAccessControls:  ${ADDRESSES[MISOAccessControls]}"
    echo -e "  MISOMarket:          ${ADDRESSES[MISOMarket]}"
    echo -e "  MISOLauncher:        ${ADDRESSES[MISOLauncher]}"
    echo ""
    echo -e "${CYAN}${BOLD}Ownership:${NC}"
    echo -e "  Multisig:            $SAFE_ADDR"
    echo ""
    echo -e "${YELLOW}${BOLD}Next Steps:${NC}"
    echo ""
    echo "1. Verify contracts on block explorer:"
    echo "   See: docs/deployment/TESTNET.md#contract-verification"
    echo ""
    echo "2. Create gauges for LP token staking (via Voter contract):"
    echo "   cast send ${ADDRESSES[Voter]} \"createGauge(address,address)\" <POOL_FACTORY> <LP_TOKEN> --rpc-url $RPC_URL"
    echo ""
    echo "3. Deploy subgraph:"
    echo "   cd packages/v2-subgraph"
    echo "   yarn build --network monad-testnet --subgraph-type v2"
    echo "   yarn deploy-testnet"
    echo ""
    echo "4. Create initial liquidity pools"
    echo "   See: docs/deployment/POST_DEPLOYMENT_SETUP.md"
    echo ""
}

# ============================================================================
# Main
# ============================================================================

main() {
    echo -e "${BLUE}${BOLD}"
    echo "============================================"
    echo "  Phasor V2 - Testnet Deployment"
    echo "============================================"
    echo -e "${NC}"
    echo -e "${YELLOW}Network: Monad Testnet (Chain ID: $CHAIN_ID)${NC}"
    echo -e "${YELLOW}RPC:     $RPC_URL${NC}"
    echo ""

    # Pre-flight checks
    check_dependencies
    check_cannonfile
    check_rpc
    check_wmon
    check_deployer_key
    check_deployer_balance

    # Gas estimation and confirmation
    estimate_gas

    # Compilation
    compile_contracts
    calculate_init_hash

    # Deployment
    deploy_contracts

    # Verification
    verify_deployment

    # Configuration updates
    update_frontend_config
    update_subgraph_config
    generate_deployment_manifest

    # Summary
    print_summary
}

# Run main function
main "$@"
