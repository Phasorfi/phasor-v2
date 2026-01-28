# Quick Start: Local Graph Node

Running your own Graph node for Phasor V2 on Monad testnet.

## 1. Setup (First Time Only)

```bash
cd packages/v2-subgraph

# Create environment file
cp .env.local.example .env.local

# Edit and set your Monad RPC URL
nano .env.local

# Start Graph node
./scripts/setup-local-node.sh
```

## 2. Deploy Subgraphs

```bash
# Deploy both subgraphs
yarn deploy:local
yarn deploy:tokens:local
```

## 3. Configure Frontend

```bash
cd ../phasor-dex

# Add to .env.local
echo "NEXT_PUBLIC_SUBGRAPH_URL=http://localhost:8000/subgraphs/name/phasor/v2" >> .env.local
echo "NEXT_PUBLIC_TOKENS_SUBGRAPH_URL=http://localhost:8000/subgraphs/name/phasor/v2-tokens" >> .env.local
```

## 4. Verify Everything Works

```bash
cd ../v2-subgraph

# Check health
yarn health

# Or manually
./scripts/check-health.sh
```

## Daily Usage

```bash
# Start Graph node (if stopped)
docker-compose up -d

# Check status
yarn health

# Stop Graph node
docker-compose down

# View logs
docker-compose logs -f graph-node
```

## After Contract Redeployment

```bash
# Rebuild and redeploy subgraphs
yarn build
yarn deploy:local
yarn deploy:tokens:local
```

## Troubleshooting

```bash
# Complete reset (deletes all data!)
docker-compose down -v
rm -rf data/
./scripts/setup-local-node.sh
yarn deploy:local
yarn deploy:tokens:local
```

## Endpoints

- **V2 Subgraph**: http://localhost:8000/subgraphs/name/phasor/v2
- **Tokens Subgraph**: http://localhost:8000/subgraphs/name/phasor/v2-tokens
- **GraphQL Playground**: Open above URLs in browser
- **Admin API**: http://localhost:8020
- **Status API**: http://localhost:8030/graphql

## Full Documentation

See [LOCAL-GRAPH-NODE.md](./LOCAL-GRAPH-NODE.md) for detailed documentation.
