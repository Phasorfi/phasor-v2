import { describe, it, expect } from 'vitest';
import { createPublicClient, http } from 'viem';
import { CONTRACTS, PAIR_ABI } from '@/config';
import { erc20Abi } from 'viem';

describe('User Positions Integration Tests', () => {
  const RPC_URL = process.env.DEFAULT_RPC_URL || 'http://127.0.0.1:8545';
  const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Anvil's first account

  const publicClient = createPublicClient({
    transport: http(RPC_URL),
  });

  it('should fetch user LP token balance for a pool', async () => {
    // Get the first pair address
    const pairAddress = await publicClient.readContract({
      address: CONTRACTS.FACTORY,
      abi: [
        {
          inputs: [{ name: '', type: 'uint256' }],
          name: 'allPairs',
          outputs: [{ name: '', type: 'address' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'allPairs',
      args: [0n],
    });

    // Get user's LP token balance
    const balance = await publicClient.readContract({
      address: pairAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [TEST_ADDRESS],
    });

    console.log('User LP balance:', balance.toString());
    expect(balance).toBeGreaterThan(0n);
  });

  it('should calculate user share percentage', async () => {
    const pairAddress = await publicClient.readContract({
      address: CONTRACTS.FACTORY,
      abi: [
        {
          inputs: [{ name: '', type: 'uint256' }],
          name: 'allPairs',
          outputs: [{ name: '', type: 'address' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'allPairs',
      args: [0n],
    });

    const [balance, totalSupply] = await Promise.all([
      publicClient.readContract({
        address: pairAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [TEST_ADDRESS],
      }),
      publicClient.readContract({
        address: pairAddress as `0x${string}`,
        abi: PAIR_ABI,
        functionName: 'totalSupply',
      }),
    ]);

    const sharePercentage = (Number(balance) / Number(totalSupply)) * 100;

    console.log('User share:', {
      balance: balance.toString(),
      totalSupply: totalSupply.toString(),
      sharePercentage: sharePercentage.toFixed(4) + '%',
    });

    expect(sharePercentage).toBeGreaterThan(0);
    expect(sharePercentage).toBeLessThanOrEqual(100);
  });

  it('should calculate user token amounts based on share', async () => {
    const pairAddress = await publicClient.readContract({
      address: CONTRACTS.FACTORY,
      abi: [
        {
          inputs: [{ name: '', type: 'uint256' }],
          name: 'allPairs',
          outputs: [{ name: '', type: 'address' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'allPairs',
      args: [0n],
    });

    const [balance, totalSupply, reserves] = await Promise.all([
      publicClient.readContract({
        address: pairAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [TEST_ADDRESS],
      }),
      publicClient.readContract({
        address: pairAddress as `0x${string}`,
        abi: PAIR_ABI,
        functionName: 'totalSupply',
      }),
      publicClient.readContract({
        address: pairAddress as `0x${string}`,
        abi: PAIR_ABI,
        functionName: 'getReserves',
      }),
    ]);

    const [reserve0, reserve1] = reserves as [bigint, bigint, number];

    // Calculate user's share of tokens
    const token0Amount = (balance * reserve0) / totalSupply;
    const token1Amount = (balance * reserve1) / totalSupply;

    console.log('User token amounts:', {
      token0Amount: token0Amount.toString(),
      token1Amount: token1Amount.toString(),
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
    });

    expect(token0Amount).toBeGreaterThan(0n);
    expect(token1Amount).toBeGreaterThan(0n);
    expect(token0Amount).toBeLessThanOrEqual(reserve0);
    expect(token1Amount).toBeLessThanOrEqual(reserve1);
  });
});
