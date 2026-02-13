#!/bin/bash
set -e

# ============================================================================
# Phasor V2 - Testnet Deployment Script
# ============================================================================
# Deploys the full Phasor ecosystem to Monad testnet using Cannon:
# - Core DEX (PoolFactory, Router)
# - Velodrome Fork ve(3,3) (Phasor, VotingEscrow, Voter, Minter, etc.)
# - VelodromeLauncher (token sale launchpad)
# - Transfers all ownership to multisig
#
# Features:
# - Pre-flight checks (RPC, balance, dependencies)
# - Gas estimation via Cannon --dry-run
# - Explicit yes/no prompts at each stage
# - Post-deployment verification
# - Environment-separated config output (.env.production)
#
# Usage:
#   ./deploy-testnet.sh
#
# Environment variables (optional overrides):
#   DEPLOYER_PRIVATE_KEY  - Deployer private key (prompted if not set)
#   RPC_URL               - RPC endpoint (default: https://testnet-rpc.monad.xyz)
#   CHAIN_ID              - Chain ID (default: 10143)
#   CANNONFILE            - Cannonfile path (default: cannonfile.toml)
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

# Configuration (can be overridden by environment variables)
RPC_URL="${RPC_URL:-$DEFAULT_RPC_URL}"
CHAIN_ID="${CHAIN_ID:-$DEFAULT_CHAIN_ID}"
CANNONFILE="${CANNONFILE:-$DEFAULT_CANNONFILE}"
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
    echo -e "${GREEN}  ✓ $1${NC}"
}

log_error() {
    echo -e "${RED}  ✗ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}  ⚠ $1${NC}"
}

log_info() {
    echo -e "${BLUE}    $1${NC}"
}

confirm() {
    local prompt="$1"
    local default="${2:-n}"

    if [ "$default" = "y" ]; then
        prompt="$prompt [Y/n]: "
    else
        prompt="$prompt [y/N]: "
    fi

    read -p "$(echo -e "${YELLOW}  $prompt${NC}")" response
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
        log_error "forge not found. Install Foundry: https://getfoundry.sh"
        missing=1
    else
        log_success "forge $(forge --version | head -1 | cut -d' ' -f2)"
    fi

    # Check cast
    if ! command -v cast &> /dev/null; then
        log_error "cast not found. Install Foundry: https://getfoundry.sh"
        missing=1
    else
        log_success "cast available"
    fi

    # Check cannon
    if ! npx @usecannon/cli --version &> /dev/null; then
        log_error "cannon not found. Run: npm install -g @usecannon/cli"
        missing=1
    else
        log_success "cannon $(npx @usecannon/cli --version 2>/dev/null | head -1)"
    fi

    # Check node
    if ! command -v node &> /dev/null; then
        log_error "node not found. Install Node.js"
        missing=1
    else
        log_success "node $(node --version)"
    fi

    # Check jq
    if ! command -v jq &> /dev/null; then
        log_error "jq not found. Install jq"
        missing=1
    else
        log_success "jq available"
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

    # Extract key addresses from cannonfile
    local deployer=$(grep -A 15 '\[var.main\]' "$CANNONFILE" | grep 'deployer' | head -1 | cut -d'"' -f2)
    local safe=$(grep -A 15 '\[var.main\]' "$CANNONFILE" | grep 'safe' | head -1 | cut -d'"' -f2)
    local wmon=$(grep -A 15 '\[var.main\]' "$CANNONFILE" | grep 'WMON' | head -1 | cut -d'"' -f2)
    local usdc=$(grep -A 20 '\[var.main\]' "$CANNONFILE" | grep 'USDC' | head -1 | cut -d'"' -f2)
    local weth=$(grep -A 20 '\[var.main\]' "$CANNONFILE" | grep 'WETH' | head -1 | cut -d'"' -f2)
    local wbtc=$(grep -A 20 '\[var.main\]' "$CANNONFILE" | grep 'WBTC' | head -1 | cut -d'"' -f2)

    log_info "Deployer: $deployer"
    log_info "Multisig: $safe"
    log_info "WMON:     $wmon"
    log_info "USDC:     $usdc"
    log_info "WETH:     $weth"
    log_info "WBTC:     $wbtc"

    DEPLOYER_ADDR="$deployer"
    SAFE_ADDR="$safe"
    WMON_ADDR="$wmon"

    # Warn about zero-address tokens
    local zero="0x0000000000000000000000000000000000000000"
    if [ "$usdc" = "$zero" ] || [ "$weth" = "$zero" ] || [ "$wbtc" = "$zero" ]; then
        log_warning "Some token addresses are set to 0x0 (will still be whitelisted in Voter)"
        log_warning "Update cannonfile.toml [var.main] with real testnet token addresses"
        if ! confirm "Continue with zero-address tokens?"; then
            exit 1
        fi
    fi
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
        log_info "Verify the WMON address in $CANNONFILE [var.main]"
        exit 1
    fi

    log_success "WMON contract exists at $WMON_ADDR"
}

check_deployer_key() {
    log_step "Checking deployer credentials..."

    if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
        echo -e "${YELLOW}  Enter deployer private key (will not be displayed):${NC}"
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

    # Minimum recommended balance (1 MON for full deployment + gas buffer)
    local min_balance="1000000000000000000"  # 1 MON in wei

    if [ "$(echo "$balance_wei < $min_balance" | bc)" -eq 1 ] 2>/dev/null; then
        log_warning "Low balance! Recommended minimum: 1 MON for full deployment"
        if ! confirm "Continue anyway?"; then
            exit 1
        fi
    fi

    log_success "Deployer balance: $balance_eth MON"
}

# ============================================================================
# Compilation
# ============================================================================

compile_contracts() {
    log_step "Compiling contracts..."

    forge build 2>&1 | while read line; do
        if [[ "$line" == *"Compiling"* ]] || [[ "$line" == *"Solc"* ]]; then
            log_info "$line"
        elif [[ "$line" == *"error"* ]] || [[ "$line" == *"Error"* ]]; then
            log_error "$line"
        fi
    done

    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        log_error "Compilation failed"
        exit 1
    fi

    log_success "Contracts compiled successfully"

    if ! confirm "Compilation successful. Continue to gas estimation?"; then
        log_info "Deployment cancelled."
        exit 0
    fi
}

# ============================================================================
# Gas Estimation (Cannon --dry-run)
# ============================================================================

estimate_gas() {
    log_step "Running Cannon dry-run to estimate gas costs..."
    log_info "This simulates the full deployment without sending transactions..."
    echo ""

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local dry_run_log="deployments/dry-run-$timestamp.log"
    mkdir -p deployments

    npx @usecannon/cli build "$CANNONFILE" \
        --private-key "$DEPLOYER_PRIVATE_KEY" \
        --rpc-url "$RPC_URL" \
        --chain-id "$CHAIN_ID" \
        --dry-run 2>&1 | tee "$dry_run_log"

    local exit_code=${PIPESTATUS[0]}

    echo ""

    if [ $exit_code -ne 0 ]; then
        log_error "Dry-run failed! Check log: $dry_run_log"
        log_info "Common issues:"
        log_info "  - Invalid artifact paths in cannonfile"
        log_info "  - Missing library dependencies"
        log_info "  - Insufficient gas limits"
        exit 1
    fi

    log_success "Dry-run complete. Log saved: $dry_run_log"

    # Show current gas price for context
    local gas_price_wei=$(cast gas-price --rpc-url "$RPC_URL" 2>/dev/null || echo "unknown")
    if [ "$gas_price_wei" != "unknown" ]; then
        local gas_price_gwei=$(echo "scale=2; $gas_price_wei / 1000000000" | bc 2>/dev/null || echo "unknown")
        log_info "Current gas price: $gas_price_gwei gwei"
    fi

    echo ""
    if ! confirm "Review the dry-run output above. Proceed with actual deployment?"; then
        log_info "Deployment cancelled. Dry-run log saved: $dry_run_log"
        exit 0
    fi
}

# ============================================================================
# Deployment
# ============================================================================

deploy_contracts() {
    log_step "Deploying contracts with Cannon..."
    log_info "This will send real transactions. This may take several minutes..."
    echo ""

    # Create deployment log file
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local log_file="deployments/cannon-output-$timestamp.log"

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
    log_step "Extracting contract addresses..."

    # Core DEX
    ADDRESSES["PoolImplementation"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.PoolImplementation\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["PoolFactory"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.PoolFactory\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')

    # Libraries
    ADDRESSES["BalanceLogicLibrary"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.BalanceLogicLibrary\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["DelegationLogicLibrary"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.DelegationLogicLibrary\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["PerlinNoise"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.PerlinNoise\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["Trig"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.Trig\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')

    # Factories
    ADDRESSES["GaugeFactory"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.GaugeFactory\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["VotingRewardsFactory"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.VotingRewardsFactory\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["ManagedRewardsFactory"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.ManagedRewardsFactory\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["FactoryRegistry"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.FactoryRegistry\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')

    # Core ve(3,3)
    ADDRESSES["Phasor"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.Phasor\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["Forwarder"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.Forwarder\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["VotingEscrow"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.VotingEscrow\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["VeArtProxy"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.VeArtProxy\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["Voter"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.Voter\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["RewardsDistributor"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.RewardsDistributor\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["Minter"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.Minter\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["Router"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.Router\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')
    ADDRESSES["VelodromeLauncher"]=$(echo "$deploy_output" | grep -A 2 "\[deploy.VelodromeLauncher\]" | grep "Contract Address:" | sed 's/.*Contract Address: //' | tr -d ' ')

    # Get deployment block
    DEPLOY_BLOCK=$(cast block latest --rpc-url "$RPC_URL" 2>/dev/null | grep -oP 'number\s+\K\d+' || echo "0")

    # Display extracted addresses
    echo ""
    echo -e "${CYAN}${BOLD}Deployed Contract Addresses:${NC}"
    echo "──────────────────────────────────────────────────"
    for contract in PoolFactory Router Phasor VotingEscrow Voter RewardsDistributor Minter VelodromeLauncher; do
        printf "  %-22s %s\n" "$contract:" "${ADDRESSES[$contract]}"
    done
    echo "──────────────────────────────────────────────────"

    # Verify we got all critical addresses
    local missing=0
    for contract in PoolFactory Router Phasor VotingEscrow Voter Minter VelodromeLauncher; do
        if [ -z "${ADDRESSES[$contract]}" ]; then
            log_error "Failed to extract address for: $contract"
            missing=1
        fi
    done

    if [ $missing -eq 1 ]; then
        log_error "Some addresses could not be extracted. Check deployment log: $log_file"
        log_warning "You may need to extract addresses manually from the log."
        exit 1
    fi

    log_success "All contracts deployed successfully"
    log_info "Deployment log: $log_file"
}

# ============================================================================
# Verification
# ============================================================================

verify_deployment() {
    log_step "Verifying deployment..."

    local errors=0

    # Verify Phasor minter is set to Minter contract
    local phasor_minter=$(cast call "${ADDRESSES[Phasor]}" "minter()(address)" --rpc-url "$RPC_URL" 2>/dev/null)
    if [ "${phasor_minter,,}" = "${ADDRESSES[Minter],,}" ]; then
        log_success "Phasor.minter = Minter contract"
    else
        log_error "Phasor.minter mismatch: expected ${ADDRESSES[Minter]}, got $phasor_minter"
        errors=1
    fi

    # Verify Router references
    local router_weth=$(cast call "${ADDRESSES[Router]}" "weth()(address)" --rpc-url "$RPC_URL" 2>/dev/null)
    if [ "${router_weth,,}" = "${WMON_ADDR,,}" ]; then
        log_success "Router.weth = WMON"
    else
        log_error "Router.weth mismatch: expected $WMON_ADDR, got $router_weth"
        errors=1
    fi

    # Verify PoolFactory admin transferred to safe
    local pool_admin=$(cast call "${ADDRESSES[PoolFactory]}" "poolAdmin()(address)" --rpc-url "$RPC_URL" 2>/dev/null)
    if [ "${pool_admin,,}" = "${SAFE_ADDR,,}" ]; then
        log_success "PoolFactory.poolAdmin = multisig"
    else
        log_error "PoolFactory.poolAdmin mismatch: expected $SAFE_ADDR, got $pool_admin"
        errors=1
    fi

    # Verify VotingEscrow team transferred to safe
    local ve_team=$(cast call "${ADDRESSES[VotingEscrow]}" "team()(address)" --rpc-url "$RPC_URL" 2>/dev/null)
    if [ "${ve_team,,}" = "${SAFE_ADDR,,}" ]; then
        log_success "VotingEscrow.team = multisig"
    else
        log_error "VotingEscrow.team mismatch: expected $SAFE_ADDR, got $ve_team"
        errors=1
    fi

    # Verify Voter governor transferred to safe
    local governor=$(cast call "${ADDRESSES[Voter]}" "governor()(address)" --rpc-url "$RPC_URL" 2>/dev/null)
    if [ "${governor,,}" = "${SAFE_ADDR,,}" ]; then
        log_success "Voter.governor = multisig"
    else
        log_error "Voter.governor mismatch: expected $SAFE_ADDR, got $governor"
        errors=1
    fi

    # Verify Minter team transferred to safe
    local minter_team=$(cast call "${ADDRESSES[Minter]}" "team()(address)" --rpc-url "$RPC_URL" 2>/dev/null)
    if [ "${minter_team,,}" = "${SAFE_ADDR,,}" ]; then
        log_success "Minter.team = multisig"
    else
        log_error "Minter.team mismatch: expected $SAFE_ADDR, got $minter_team"
        errors=1
    fi

    # Verify VelodromeLauncher owner transferred to safe
    local launcher_owner=$(cast call "${ADDRESSES[VelodromeLauncher]}" "owner()(address)" --rpc-url "$RPC_URL" 2>/dev/null)
    if [ "${launcher_owner,,}" = "${SAFE_ADDR,,}" ]; then
        log_success "VelodromeLauncher.owner = multisig"
    else
        log_error "VelodromeLauncher.owner mismatch: expected $SAFE_ADDR, got $launcher_owner"
        errors=1
    fi

    echo ""
    if [ $errors -eq 0 ]; then
        log_success "All ownership verifications passed"
    else
        log_warning "Some verifications failed - check the errors above"
    fi
}

# ============================================================================
# Configuration Updates
# ============================================================================

update_frontend_config() {
    log_step "Updating frontend configuration..."

    local env_file="packages/phasor-dex/.env.production"

    # Backup existing file
    if [ -f "$env_file" ]; then
        cp "$env_file" "${env_file}.backup-$(date +%Y%m%d_%H%M%S)"
        log_info "Backed up existing $env_file"
    fi

    cat > "$env_file" << EOF
# Phasor V2 - Testnet Configuration
# Auto-generated by deploy-testnet.sh on $(date)
# Loaded automatically by Next.js during \`next build\` / \`next start\`

# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_DEFAULT_RPC_URL=$RPC_URL

# Core DEX Contracts
NEXT_PUBLIC_POOL_FACTORY_ADDRESS=${ADDRESSES[PoolFactory]}
NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS=${ADDRESSES[Router]}
NEXT_PUBLIC_DEFAULT_WMON_ADDRESS=$WMON_ADDR

# ve(3,3) Governance & Staking
NEXT_PUBLIC_PHASOR_TOKEN_ADDRESS=${ADDRESSES[Phasor]}
NEXT_PUBLIC_VOTING_ESCROW_ADDRESS=${ADDRESSES[VotingEscrow]}
NEXT_PUBLIC_VOTER_ADDRESS=${ADDRESSES[Voter]}
NEXT_PUBLIC_REWARDS_DISTRIBUTOR_ADDRESS=${ADDRESSES[RewardsDistributor]}
NEXT_PUBLIC_MINTER_ADDRESS=${ADDRESSES[Minter]}

# Launchpad
NEXT_PUBLIC_VELODROME_LAUNCHER_ADDRESS=${ADDRESSES[VelodromeLauncher]}

# Indexer (update after indexer deployment)
# NEXT_PUBLIC_ENVIO_URL=https://your-envio-endpoint/v1/graphql
EOF

    log_success "Frontend .env.production updated: $env_file"
}

update_envio_config() {
    log_step "Updating Envio indexer configuration..."

    local env_file="packages/envio-indexer/.env.production"

    # Backup existing file
    if [ -f "$env_file" ]; then
        cp "$env_file" "${env_file}.backup-$(date +%Y%m%d_%H%M%S)"
        log_info "Backed up existing $env_file"
    fi

    # Extract token addresses from cannonfile
    local usdc=$(grep -A 20 '\[var.main\]' "$CANNONFILE" | grep 'USDC' | head -1 | cut -d'"' -f2)

    cat > "$env_file" << EOF
# Phasor V2 - Testnet Envio Indexer Configuration
# Auto-generated by deploy-testnet.sh on $(date)
# To activate: cp .env.production .env && envio dev
# Or use: npm run dev:testnet

ENVIO_MONAD_RPC_URL=$RPC_URL
ENVIO_MONAD_WMON_ADDRESS=$WMON_ADDR
ENVIO_MONAD_USDC_ADDRESS=$usdc
ENVIO_MONAD_PHASOR_ADDRESS=${ADDRESSES[Phasor]}
ENVIO_MONAD_POOL_FACTORY_ADDRESS=${ADDRESSES[PoolFactory]}
EOF

    log_success "Envio .env.production updated: $env_file"
}

generate_deployment_manifest() {
    log_step "Generating deployment manifest..."

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local manifest_file="deployments/deployment-testnet-$timestamp.json"

    cat > "$manifest_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "network": {
    "name": "Monad Testnet",
    "chainId": $CHAIN_ID,
    "rpcUrl": "$RPC_URL"
  },
  "deployer": "$DEPLOYER_ADDR",
  "multisig": "$SAFE_ADDR",
  "deployBlock": $DEPLOY_BLOCK,
  "contracts": {
    "core": {
      "PoolImplementation": "${ADDRESSES[PoolImplementation]}",
      "PoolFactory": "${ADDRESSES[PoolFactory]}",
      "Router": "${ADDRESSES[Router]}"
    },
    "libraries": {
      "BalanceLogicLibrary": "${ADDRESSES[BalanceLogicLibrary]}",
      "DelegationLogicLibrary": "${ADDRESSES[DelegationLogicLibrary]}",
      "PerlinNoise": "${ADDRESSES[PerlinNoise]}",
      "Trig": "${ADDRESSES[Trig]}"
    },
    "factories": {
      "GaugeFactory": "${ADDRESSES[GaugeFactory]}",
      "VotingRewardsFactory": "${ADDRESSES[VotingRewardsFactory]}",
      "ManagedRewardsFactory": "${ADDRESSES[ManagedRewardsFactory]}",
      "FactoryRegistry": "${ADDRESSES[FactoryRegistry]}"
    },
    "governance": {
      "Phasor": "${ADDRESSES[Phasor]}",
      "Forwarder": "${ADDRESSES[Forwarder]}",
      "VotingEscrow": "${ADDRESSES[VotingEscrow]}",
      "VeArtProxy": "${ADDRESSES[VeArtProxy]}",
      "Voter": "${ADDRESSES[Voter]}",
      "RewardsDistributor": "${ADDRESSES[RewardsDistributor]}",
      "Minter": "${ADDRESSES[Minter]}"
    },
    "launchpad": {
      "VelodromeLauncher": "${ADDRESSES[VelodromeLauncher]}"
    },
    "external": {
      "WMON": "$WMON_ADDR"
    }
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
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════${NC}"
    echo -e "${GREEN}${BOLD}  Deployment Complete!${NC}"
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}${BOLD}Network:${NC}"
    echo -e "  Chain ID:  $CHAIN_ID"
    echo -e "  RPC URL:   $RPC_URL"
    echo -e "  Block:     $DEPLOY_BLOCK"
    echo ""
    echo -e "${CYAN}${BOLD}Core DEX:${NC}"
    echo -e "  PoolFactory:  ${ADDRESSES[PoolFactory]}"
    echo -e "  Router:       ${ADDRESSES[Router]}"
    echo -e "  WMON:         $WMON_ADDR"
    echo ""
    echo -e "${CYAN}${BOLD}ve(3,3) Governance:${NC}"
    echo -e "  Phasor:              ${ADDRESSES[Phasor]}"
    echo -e "  VotingEscrow:        ${ADDRESSES[VotingEscrow]}"
    echo -e "  Voter:               ${ADDRESSES[Voter]}"
    echo -e "  RewardsDistributor:  ${ADDRESSES[RewardsDistributor]}"
    echo -e "  Minter:              ${ADDRESSES[Minter]}"
    echo ""
    echo -e "${CYAN}${BOLD}Launchpad:${NC}"
    echo -e "  VelodromeLauncher:   ${ADDRESSES[VelodromeLauncher]}"
    echo ""
    echo -e "${CYAN}${BOLD}Ownership:${NC}"
    echo -e "  Multisig:            $SAFE_ADDR"
    echo ""
    echo -e "${CYAN}${BOLD}Config Files Updated:${NC}"
    echo -e "  Frontend:  packages/phasor-dex/.env.production"
    echo -e "  Envio:     packages/envio-indexer/.env.production"
    echo -e "  Manifest:  deployments/deployment-testnet-*.json"
    echo ""
    echo -e "${YELLOW}${BOLD}Next Steps:${NC}"
    echo ""
    echo "  1. Create initial liquidity pools:"
    echo "     See docs/deployment/POST_DEPLOYMENT_SETUP.md"
    echo ""
    echo "  2. Deploy the Envio indexer:"
    echo "     cd packages/envio-indexer"
    echo "     cp .env.production .env"
    echo "     # Update config.yaml with PoolFactory address and start block"
    echo "     envio dev"
    echo ""
    echo "  3. Build frontend for testnet:"
    echo "     cd packages/phasor-dex"
    echo "     next build  # automatically loads .env.production"
    echo ""
    echo "  4. Verify contracts on block explorer:"
    echo "     https://testnet.monadexplorer.com"
    echo ""
}

# ============================================================================
# Main
# ============================================================================

main() {
    echo -e "${BLUE}${BOLD}"
    echo "════════════════════════════════════════════"
    echo "  Phasor V2 - Testnet Deployment"
    echo "════════════════════════════════════════════"
    echo -e "${NC}"
    echo -e "${YELLOW}Network: Monad Testnet (Chain ID: $CHAIN_ID)${NC}"
    echo -e "${YELLOW}RPC:     $RPC_URL${NC}"
    echo -e "${YELLOW}Cannon:  $CANNONFILE${NC}"
    echo ""

    # Pre-flight checks
    check_dependencies
    check_cannonfile
    check_rpc
    check_wmon
    check_deployer_key
    check_deployer_balance

    # Compilation
    compile_contracts

    # Gas estimation via dry-run
    estimate_gas

    # Deployment
    deploy_contracts

    # Verification
    verify_deployment

    # Configuration updates
    echo ""
    if confirm "Update configuration files (frontend, envio, manifest)?"; then
        update_frontend_config
        update_envio_config
        generate_deployment_manifest
    else
        log_info "Skipped config updates. You can update them manually."
    fi

    # Summary
    print_summary
}

# Run main function
main "$@"
