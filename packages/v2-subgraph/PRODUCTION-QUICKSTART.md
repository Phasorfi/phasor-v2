# Production Deployment - Quick Start

## TL;DR - Fastest Path to Production

### Option 1: The Graph Studio (RECOMMENDED - FREE!)

**Cost:** FREE
**Time:** 10 minutes
**Best for:** Quick deployment with official Graph infrastructure

```bash
# 1. Go to https://thegraph.com/studio and sign in with your wallet

# 2. Click "Create a Subgraph"
#    Name: phasor-v2
#    Network: You'll configure this later

# 3. Install Graph CLI
npm install -g @graphprotocol/graph-cli

# 4. Build your subgraph
cd packages/v2-subgraph
yarn install
yarn build --network monad --subgraph-type v2

# 5. Get your deploy key from Studio dashboard
#    Copy the "Deploy Key" from your subgraph page

# 6. Authenticate
graph auth --studio YOUR_DEPLOY_KEY

# 7. Deploy
graph deploy --studio phasor-v2 v2-subgraph.yaml

# 8. Get your endpoint from Studio dashboard
#    It will be: https://api.studio.thegraph.com/query/<ID>/phasor-v2/version/latest
```

**Update Vercel:**
```
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/<YOUR_ID>/phasor-v2/version/latest
```

**Note:** The Graph Studio is free for development and production use. Perfect for new chains like Monad!

---

### Option 2: Goldsky (Managed Service)

**Cost:** Free tier available, $99/mo for production
**Time:** 5 minutes

```bash
# 1. Sign up at goldsky.com

# 2. Install CLI (choose one method):
# Method A: curl
curl https://goldsky.com | sh

# Method B: npm
npm install -g @goldskycom/cli

# 3. Login
goldsky login

# 4. Deploy
cd packages/v2-subgraph
yarn build --network monad --subgraph-type v2
goldsky subgraph deploy phasor-v2/v1.0.0 \
  --path ./v2-subgraph.yaml

# 5. Get endpoint
goldsky subgraph list
```

**Update Vercel:**
```
NEXT_PUBLIC_SUBGRAPH_URL=https://api.goldsky.com/api/public/project_<id>/subgraphs/phasor-v2/v1.0.0/gn
```

---

### Option 3: Self-Hosted on DigitalOcean

**Cost:** $24/month
**Time:** 30 minutes
**Best for:** Full control, custom requirements

```bash
# 1. Create a DigitalOcean droplet
#    - Size: Basic - 4GB RAM / 2 vCPUs ($24/mo)
#    - Image: Ubuntu 22.04
#    - Add your SSH key

# 2. SSH into droplet
ssh root@your-droplet-ip

# 3. Install Docker
curl -fsSL https://get.docker.com | sh

# 4. Clone your repo
git clone https://github.com/your-username/phasor-v2.git
cd phasor-v2/packages/v2-subgraph

# 5. Configure
cp .env.production.example .env.production
nano .env.production
# Set ETHEREUM_RPC_URL to your Monad RPC endpoint

# 6. Start Graph Node
docker-compose -f docker-compose.production.yml up -d

# 7. Install dependencies and deploy
npm install -g yarn
yarn install
yarn build --network monad --subgraph-type v2
GRAPH_NODE_URL=http://localhost:8020 IPFS_URL=http://localhost:5001 ./scripts/deploy-hosted.sh

# 8. Check health
yarn health

# 9. Get your subgraph URL
echo "Your subgraph URL: http://your-droplet-ip:8000/subgraphs/name/phasor/phasor-v2"
```

**Update Vercel:**
```
NEXT_PUBLIC_SUBGRAPH_URL=http://your-droplet-ip:8000/subgraphs/name/phasor/phasor-v2
```

---

## Post-Deployment Checklist

- [ ] Subgraph is syncing (check Studio dashboard or run `yarn health`)
- [ ] Query returns data: Test in GraphQL Playground
- [ ] Updated `NEXT_PUBLIC_SUBGRAPH_URL` in Vercel
- [ ] Redeployed frontend on Vercel
- [ ] Tested pools page loads with data
- [ ] Set up monitoring/alerts (optional)

---

## Comparison Table

| Option | Cost | Setup Time | Pros | Cons |
|--------|------|------------|------|------|
| **The Graph Studio** | FREE | 10 min | Official, reliable, free | None for Monad |
| **Goldsky** | Free/$99/mo | 5 min | Managed, easy | Paid for production |
| **Self-Hosted** | $24/mo | 30 min | Full control | Server management |

**Recommendation:** Start with **The Graph Studio** - it's free, official, and perfect for Monad.

---

## Troubleshooting

**Subgraph not syncing?**
```bash
# For Studio: Check the dashboard for sync status and errors
# For self-hosted: Check logs
docker-compose -f docker-compose.production.yml logs -f graph-node

# Common fixes:
# 1. Verify RPC endpoint is accessible
# 2. Check factory address in config/monad/config.json
# 3. Verify start block is correct
# 4. Ensure Graph node can reach RPC (firewall rules)
```

**No data showing up?**
```bash
# Check if factory contract has any pairs
cast call 0xYourFactoryAddress "allPairsLength()" --rpc-url your-rpc

# Verify subgraph is indexing events
# Test in GraphQL Playground or:
curl -X POST -H "Content-Type: application/json" \
  -d '{"query": "{ _meta { block { number } } }"}' \
  YOUR_SUBGRAPH_URL
```

**Need to redeploy?**
```bash
# Update config if needed
nano config/monad/config.json

# Rebuild
yarn build --network monad --subgraph-type v2

# Redeploy to Studio
graph deploy --studio phasor-v2 v2-subgraph.yaml

# Or redeploy to self-hosted
./scripts/deploy-hosted.sh
```

---

## Production Best Practices

1. **Use The Graph Studio first** - It's free and reliable
2. **Monitor sync status** - Check dashboard regularly
3. **Version your deployments** - Use semantic versioning (v1.0.0, v1.0.1, etc.)
4. **Test queries** - Use GraphQL Playground before going live
5. **Have a backup** - Consider having a fallback subgraph endpoint

---

## Need Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide on all deployment options.

**Sources:**
- [The Graph Supported Networks](https://thegraph.com/docs/en/supported-networks/)
- [The Graph Studio Documentation](https://thegraph.com/studio)
- [Goldsky CLI Reference](https://docs.goldsky.com/reference/cli)
