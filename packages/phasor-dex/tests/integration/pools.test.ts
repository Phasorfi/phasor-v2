import { describe, it, expect } from 'vitest';
import { createPublicClient, http } from 'viem';
import { CONTRACTS, FACTORY_ABI, PAIR_ABI } from '@/config';
import { DEFAULT_TOKENS } from '@/config/chains';

describe('Pools Integration Tests', () => {
  const RPC_URL = process.env.DEFAULT_RPC_URL || 'http://127.0.0.1:8545';

  const publicClient = createPublicClient({
    transport: http(RPC_URL),
  });

  it('should fetch the number of pools from factory', async () => {
    const pairsLength = await publicClient.readContract({
      address: CONTRACTS.FACTORY,
      abi: FACTORY_ABI,
      functionName: 'allPairsLength',
    });

    console.log('Total pairs:', pairsLength.toString());
    expect(pairsLength).toBeGreaterThan(0n);
  });

  it('should fetch first pair address', async () => {
    const pairAddress = await publicClient.readContract({
      address: CONTRACTS.FACTORY,
      abi: FACTORY_ABI,
      functionName: 'allPairs',
      args: [0n],
    });

    console.log('First pair address:', pairAddress);
    expect(pairAddress).toBeDefined();
    expect(pairAddress).not.toBe('0x0000000000000000000000000000000000000000');
  });

  it('should fetch pair data', async () => {
    const pairAddress = await publicClient.readContract({
      address: CONTRACTS.FACTORY,
      abi: FACTORY_ABI,
      functionName: 'allPairs',
      args: [0n],
    });

    const [token0, token1, reserves, totalSupply] = await Promise.all([
      publicClient.readContract({
        address: pairAddress as `0x${string}`,
        abi: PAIR_ABI,
        functionName: 'token0',
      }),
      publicClient.readContract({
        address: pairAddress as `0x${string}`,
        abi: PAIR_ABI,
        functionName: 'token1',
      }),
      publicClient.readContract({
        address: pairAddress as `0x${string}`,
        abi: PAIR_ABI,
        functionName: 'getReserves',
      }),
      publicClient.readContract({
        address: pairAddress as `0x${string}`,
        abi: PAIR_ABI,
        functionName: 'totalSupply',
      }),
    ]);

    console.log('Pair data:', {
      pairAddress,
      token0,
      token1,
      reserves: reserves ? [reserves[0].toString(), reserves[1].toString()] : null,
      totalSupply: totalSupply.toString(),
    });

    expect(token0).toBeDefined();
    expect(token1).toBeDefined();
    expect(reserves).toBeDefined();
    expect(totalSupply).toBeGreaterThan(0n);

    // Verify tokens are in DEFAULT_TOKENS
    const token0Info = DEFAULT_TOKENS.find(
      (t) => t.address.toLowerCase() === token0.toLowerCase()
    );
    const token1Info = DEFAULT_TOKENS.find(
      (t) => t.address.toLowerCase() === token1.toLowerCase()
    );

    console.log('Token info:', {
      token0: token0Info ? `${token0Info.symbol} (${token0Info.name})` : 'Unknown',
      token1: token1Info ? `${token1Info.symbol} (${token1Info.name})` : 'Unknown',
    });
  });
});
