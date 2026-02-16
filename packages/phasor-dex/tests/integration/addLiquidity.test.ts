import { describe, it, expect, beforeAll } from 'vitest';
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACTS } from '@/config/chains';
import { erc20Abi } from 'viem';

// Router ABI - just the functions we need
const ROUTER_ABI = [
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'amountADesired', type: 'uint256' },
      { name: 'amountBDesired', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'addLiquidity',
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
      { name: 'liquidity', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Factory ABI
const FACTORY_ABI = [
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    name: 'getPair',
    outputs: [{ name: 'pair', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Pair ABI
const PAIR_ABI = [
  {
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

describe('Add Liquidity Integration Tests', () => {
  const RPC_URL = process.env.DEFAULT_RPC_URL || 'http://127.0.0.1:8545';
  const CHAIN_ID = parseInt(process.env.DEFAULT_CHAIN_ID || '10143');

  // Test account (Anvil's first account)
  const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const account = privateKeyToAccount(TEST_PRIVATE_KEY);

  const publicClient = createPublicClient({
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    transport: http(RPC_URL),
  });

  const TKN1 = process.env.NEXT_PUBLIC_DEFAULT_TKN1_ADDRESS as `0x${string}`;
  const TKN2 = process.env.NEXT_PUBLIC_DEFAULT_TKN2_ADDRESS as `0x${string}`;
  const ROUTER = CONTRACTS.ROUTER;
  const FACTORY = CONTRACTS.FACTORY;

  beforeAll(() => {
    expect(TKN1).toBeDefined();
    expect(TKN2).toBeDefined();
    expect(ROUTER).toBeDefined();
    expect(FACTORY).toBeDefined();
  });

  it('should check token balances', async () => {
    const balance1 = await publicClient.readContract({
      address: TKN1,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address],
    });

    const balance2 = await publicClient.readContract({
      address: TKN2,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address],
    });

    console.log('TKN1 Balance:', formatUnits(balance1, 18));
    console.log('TKN2 Balance:', formatUnits(balance2, 18));

    expect(balance1).toBeGreaterThan(0n);
    expect(balance2).toBeGreaterThan(0n);
  });

  it('should approve tokens for Router', async () => {
    const approvalAmount = parseUnits('1000000', 18); // Large approval

    // Approve TKN1
    const hash1 = await walletClient.writeContract({
      address: TKN1,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ROUTER, approvalAmount],
      chain: null,
    });

    const receipt1 = await publicClient.waitForTransactionReceipt({ hash: hash1 });
    expect(receipt1.status).toBe('success');

    // Approve TKN2
    const hash2 = await walletClient.writeContract({
      address: TKN2,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ROUTER, approvalAmount],
      chain: null,
    });

    const receipt2 = await publicClient.waitForTransactionReceipt({ hash: hash2 });
    expect(receipt2.status).toBe('success');

    // Verify allowances
    const allowance1 = await publicClient.readContract({
      address: TKN1,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [account.address, ROUTER],
    });

    const allowance2 = await publicClient.readContract({
      address: TKN2,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [account.address, ROUTER],
    });

    expect(allowance1).toBeGreaterThanOrEqual(approvalAmount);
    expect(allowance2).toBeGreaterThanOrEqual(approvalAmount);
  });

  it('should add liquidity successfully', async () => {
    const amountA = parseUnits('0.00001', 18); // 1e13 wei
    const amountB = parseUnits('0.00001', 18); // 1e13 wei
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes

    // Get pair address before
    const pairBefore = await publicClient.readContract({
      address: FACTORY,
      abi: FACTORY_ABI,
      functionName: 'getPair',
      args: [TKN1, TKN2],
    });

    console.log('Pair address:', pairBefore);

    // Add liquidity
    const hash = await walletClient.writeContract({
      address: ROUTER,
      abi: ROUTER_ABI,
      functionName: 'addLiquidity',
      args: [
        TKN1,
        TKN2,
        amountA,
        amountB,
        0n, // amountAMin (0 for testing)
        0n, // amountBMin (0 for testing)
        account.address,
        deadline,
      ],
      gas: 5000000n,
      chain: null,
    });

    console.log('Add liquidity tx:', hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    expect(receipt.status).toBe('success');
    expect(receipt.logs.length).toBeGreaterThan(0);

    // Verify pair was created (if it didn't exist) or liquidity was added
    const pairAfter = await publicClient.readContract({
      address: FACTORY,
      abi: FACTORY_ABI,
      functionName: 'getPair',
      args: [TKN1, TKN2],
    });

    expect(pairAfter).not.toBe('0x0000000000000000000000000000000000000000');

    // Check pair reserves
    if (pairAfter !== '0x0000000000000000000000000000000000000000') {
      const reserves = await publicClient.readContract({
        address: pairAfter,
        abi: PAIR_ABI,
        functionName: 'getReserves',
      });

      console.log('Reserves:', {
        reserve0: formatUnits(reserves[0], 18),
        reserve1: formatUnits(reserves[1], 18),
      });

      expect(reserves[0]).toBeGreaterThan(0n);
      expect(reserves[1]).toBeGreaterThan(0n);

      // Check LP token balance
      const lpBalance = await publicClient.readContract({
        address: pairAfter,
        abi: PAIR_ABI,
        functionName: 'balanceOf',
        args: [account.address],
      });

      console.log('LP Token Balance:', formatUnits(lpBalance, 18));
      expect(lpBalance).toBeGreaterThan(0n);
    }
  });

  it('should add liquidity to existing pair', async () => {
    const amountA = parseUnits('0.00001', 18);
    const amountB = parseUnits('0.00001', 18);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

    // Get pair address
    const pair = await publicClient.readContract({
      address: FACTORY,
      abi: FACTORY_ABI,
      functionName: 'getPair',
      args: [TKN1, TKN2],
    });

    expect(pair).not.toBe('0x0000000000000000000000000000000000000000');

    // Get reserves before
    const reservesBefore = await publicClient.readContract({
      address: pair,
      abi: PAIR_ABI,
      functionName: 'getReserves',
    });

    const lpBalanceBefore = await publicClient.readContract({
      address: pair,
      abi: PAIR_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });

    // Add more liquidity
    const hash = await walletClient.writeContract({
      address: ROUTER,
      abi: ROUTER_ABI,
      functionName: 'addLiquidity',
      args: [TKN1, TKN2, amountA, amountB, 0n, 0n, account.address, deadline],
      gas: 5000000n,
      chain: null,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    expect(receipt.status).toBe('success');

    // Get reserves after
    const reservesAfter = await publicClient.readContract({
      address: pair,
      abi: PAIR_ABI,
      functionName: 'getReserves',
    });

    const lpBalanceAfter = await publicClient.readContract({
      address: pair,
      abi: PAIR_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });

    // Reserves should have increased
    expect(reservesAfter[0]).toBeGreaterThan(reservesBefore[0]);
    expect(reservesAfter[1]).toBeGreaterThan(reservesBefore[1]);

    // LP balance should have increased
    expect(lpBalanceAfter).toBeGreaterThan(lpBalanceBefore);

    console.log('Reserves increased from', {
      before: [formatUnits(reservesBefore[0], 18), formatUnits(reservesBefore[1], 18)],
      after: [formatUnits(reservesAfter[0], 18), formatUnits(reservesAfter[1], 18)],
    });
    console.log('LP balance increased from', formatUnits(lpBalanceBefore, 18), 'to', formatUnits(lpBalanceAfter, 18));
  });
});
