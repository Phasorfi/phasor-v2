# Running Your Own Graph Node for Phasor V2

This guide will help you set up and run your own Graph node to index Phasor V2 DEX data from Monad testnet.

## Why Run Your Own Graph Node?

- **Independence**: Don't rely on hosted services that may be out of sync
- **Reliability**: Full control over indexing and data freshness
- **Performance**: Lower latency for your local development
- **Monad Testnet**: Essential for testnets that undergo regenesis

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available for Docker
- Access to a Monad testnet RPC endpoint (public or private)
- Node.js and Yarn installed

## Quick Start

### 1. Configure Your RPC Endpoint

```bash
cd packages/v2-subgraph

# Create your local environment file
cp .env.local.example .env.local

# Edit .env.local and set your RPC URL
# For public RPC: MONAD_RPC_URL=https://testnet-rpc.monad.xyz
# For local node: MONAD_RPC_URL=http://host.docker.internal:8545
nano .env.local
```

### 2. Start the Graph Node

```bash
# This will start PostgreSQL, IPFS, and Graph Node in Docker
./scripts/setup-local-node.sh
```

The script will:
- Create necessary data directories
- Start Docker containers
- Wait for all services to be ready
- Display endpoint URLs

### 3. Deploy Your Subgraphs

```bash
# Deploy the main V2 subgraph (pairs, swaps, liquidity)
yarn deploy:local

# Deploy the tokens subgraph (token prices, volumes)
yarn deploy:tokens:local
```

### 4. Update Your Frontend Configuration

Update your frontend to point to your local Graph node:

```bash
cd ../phasor-dex

# Edit .env.local
NEXT_PUBLIC_SUBGRAPH_URL=http://localhost:8000/subgraphs/name/phasor/v2
NEXT_PUBLIC_TOKENS_SUBGRAPH_URL=http://localhost:8000/subgraphs/name/phasor/v2-tokens
```

## Services and Endpoints

Once running, you'll have access to:

### Graph Node
- **GraphQL HTTP**: `http://localhost:8000/subgraphs/name/<subgraph-name>`
- **GraphQL WebSocket**: `ws://localhost:8001/subgraphs/name/<subgraph-name>`
- **Admin API**: `http://localhost:8020`
- **Index Status**: `http://localhost:8030/graphql`

### IPFS
- **API**: `http://localhost:5001`
- **Gateway**: `http://localhost:8080`

### PostgreSQL
- **Host**: `localhost:5432`
- **Database**: `graph-node`
- **User**: `graph-node`
- **Password**: `let-me-in`

## Checking Indexing Status

### Quick Health Check

```bash
curl http://localhost:8030/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{indexingStatuses { subgraph health synced }}"}'
```

### Detailed Status

```bash
curl http://localhost:8030/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{indexingStatuses { subgraph health synced fatalError { message } chains { network latestBlock { number } chainHeadBlock { number } } } }"}'
```

### Monitor Logs

```bash
# Follow Graph node logs
docker-compose logs -f graph-node

# Check for errors
docker-compose logs graph-node | grep ERROR

# View all services
docker-compose logs
```

## Managing Your Graph Node

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Data (Complete Reset)

```bash
# Warning: This will delete all indexed data!
docker-compose down -v
rm -rf data/
```

### Restart Services

```bash
docker-compose restart
```

### Rebuild and Redeploy Subgraph

```bash
# After making changes to mappings or schema
yarn build
yarn deploy:local
yarn deploy:tokens:local
```

## Troubleshooting

### Graph Node Not Starting

1. Check Docker logs:
   ```bash
   docker-compose logs graph-node
   ```

2. Verify RPC connection:
   ```bash
   curl -X POST $MONAD_RPC_URL \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

3. Check disk space:
   ```bash
   df -h
   ```

### Subgraph Not Syncing

1. Check indexing status (see above)

2. Look for errors in logs:
   ```bash
   docker-compose logs graph-node | grep "ERROR"
   ```

3. Common issues:
   - **RPC timeout**: Increase timeout in docker-compose.yml
   - **Rate limiting**: Use a private RPC endpoint or increase limits
   - **Block reorganization**: Normal on testnets, wait for sync

### Slow Indexing

1. **Increase PostgreSQL connections**:
   Edit docker-compose.yml:
   ```yaml
   command: ["postgres", "-cmax_connections=400"]
   ```

2. **Allocate more resources**:
   Increase Docker Desktop memory to 8GB+

3. **Use a faster RPC**:
   Switch to a private or local Monad node

### Reset Everything

If you encounter persistent issues:

```bash
# Stop and remove everything
docker-compose down -v
rm -rf data/

# Start fresh
./scripts/setup-local-node.sh
yarn deploy:local
yarn deploy:tokens:local
```

## Performance Optimization

### For Faster Syncing

1. **Use a local Monad node** instead of public RPC
2. **Increase PostgreSQL shared buffers**:
   ```yaml
   # In docker-compose.yml
   command: [
     "postgres",
     "-cshared_preload_libraries=pg_stat_statements",
     "-cshared_buffers=2GB",
     "-ceffective_cache_size=6GB"
   ]
   ```

3. **Use SSD storage** for data volumes

### For Production

1. **Persistent storage**: Use Docker volumes or external storage
2. **Monitoring**: Set up Prometheus + Grafana
3. **Backups**: Regular PostgreSQL backups
4. **High availability**: Run multiple Graph nodes

## Network Configuration

### Using a Local Monad Node

If you're running a Monad node locally:

```bash
# In .env.local
MONAD_RPC_URL=http://host.docker.internal:8545
```

The `host.docker.internal` hostname allows Docker containers to access services on your host machine.

### Using a Private RPC

```bash
# In .env.local
MONAD_RPC_URL=https://your-private-rpc.example.com
```

### Port Conflicts

If ports 5001, 5432, 8000, 8001, 8020, or 8030 are already in use, edit `docker-compose.yml` to use different ports:

```yaml
ports:
  - '8001:8000'  # Map to different host port
```

## Data Persistence

Graph node data is stored in `./data/`:
- `./data/postgres/` - PostgreSQL database
- `./data/ipfs/` - IPFS repository

**Important**: Add `data/` to `.gitignore` to avoid committing large files.

## Security Notes

⚠️ **This setup is for development only!**

For production:
1. Change the PostgreSQL password in docker-compose.yml
2. Use proper secrets management
3. Enable authentication on IPFS
4. Set up firewall rules
5. Use HTTPS for all endpoints

## Next Steps

1. ✅ Graph node running locally
2. ✅ Subgraphs deployed
3. ✅ Frontend configured to use local endpoints
4. 🎯 Start developing with real-time, reliable data!

## Additional Resources

- [The Graph Documentation](https://thegraph.com/docs/)
- [Graph Node Repository](https://github.com/graphprotocol/graph-node)
- [Monad Documentation](https://docs.monad.xyz/)
- [Phasor V2 Subgraph Docs](./README.md)
