// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/token/PhasorToken.sol";
import "../contracts/farming/MasterChef.sol";
import "../contracts/test/MockLP.sol";

contract MasterChefTest is Test {
    PhasorToken public phasor;
    MasterChef public chef;
    MockLP public lpToken;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    uint256 public constant PHASOR_PER_BLOCK = 100 * 1e18;

    function setUp() public {
        vm.startPrank(owner);

        // Deploy PHASOR token
        phasor = new PhasorToken();

        // Deploy MasterChef (start at current block)
        chef = new MasterChef(phasor, PHASOR_PER_BLOCK, block.number);

        // Transfer ownership to MasterChef so it can mint
        phasor.transferOwnership(address(chef));

        // Create mock LP token
        lpToken = new MockLP();

        // Add pool (1000 allocation points)
        chef.add(1000, lpToken);

        vm.stopPrank();
    }

    function testAddPool() public view {
        assertEq(chef.poolLength(), 1, "Should have 1 pool");
        assertEq(chef.totalAllocPoint(), 1000, "Total alloc points should be 1000");
    }

    function testDeposit() public {
        // Give user1 some LP tokens
        vm.prank(owner);
        lpToken.transfer(user1, 1000 * 1e18);

        // User1 deposits
        vm.startPrank(user1);
        lpToken.approve(address(chef), 1000 * 1e18);
        chef.deposit(0, 1000 * 1e18);
        vm.stopPrank();

        (uint256 amount,) = chef.userInfo(0, user1);
        assertEq(amount, 1000 * 1e18, "User1 should have 1000 LP staked");
    }

    function testHarvest() public {
        // Setup: give user1 LP tokens and deposit
        vm.prank(owner);
        lpToken.transfer(user1, 1000 * 1e18);

        vm.startPrank(user1);
        lpToken.approve(address(chef), 1000 * 1e18);
        chef.deposit(0, 1000 * 1e18);
        vm.stopPrank();

        // Mine 10 blocks
        vm.roll(block.number + 10);

        // Check pending rewards
        uint256 pending = chef.pendingPhasor(0, user1);
        assertGt(pending, 0, "Should have pending rewards");

        // Expected rewards: 10 blocks * 100 PHASOR per block = 1000 PHASOR
        assertEq(pending, 10 * PHASOR_PER_BLOCK, "Should have 1000 PHASOR pending");

        // Harvest by depositing 0
        vm.prank(user1);
        chef.deposit(0, 0);

        // Check PHASOR balance
        assertEq(phasor.balanceOf(user1), 10 * PHASOR_PER_BLOCK, "User1 should have harvested PHASOR");
    }

    function testWithdraw() public {
        // Setup: give user1 LP tokens and deposit
        vm.prank(owner);
        lpToken.transfer(user1, 1000 * 1e18);

        vm.startPrank(user1);
        lpToken.approve(address(chef), 1000 * 1e18);
        chef.deposit(0, 1000 * 1e18);
        vm.stopPrank();

        // Mine 5 blocks
        vm.roll(block.number + 5);

        // Withdraw half
        vm.prank(user1);
        chef.withdraw(0, 500 * 1e18);

        (uint256 amount,) = chef.userInfo(0, user1);
        assertEq(amount, 500 * 1e18, "User1 should have 500 LP remaining");
        assertEq(lpToken.balanceOf(user1), 500 * 1e18, "User1 should have received 500 LP back");

        // Should also have harvested rewards from 5 blocks
        assertEq(phasor.balanceOf(user1), 5 * PHASOR_PER_BLOCK, "User1 should have harvested PHASOR");
    }

    function testMultipleUsers() public {
        // Give both users LP tokens
        vm.startPrank(owner);
        lpToken.transfer(user1, 1000 * 1e18);
        lpToken.transfer(user2, 1000 * 1e18);
        vm.stopPrank();

        // Both users deposit (user1 deposits 2x as much)
        vm.startPrank(user1);
        lpToken.approve(address(chef), 1000 * 1e18);
        chef.deposit(0, 1000 * 1e18);
        vm.stopPrank();

        vm.startPrank(user2);
        lpToken.approve(address(chef), 500 * 1e18);
        chef.deposit(0, 500 * 1e18);
        vm.stopPrank();

        // Mine 9 blocks
        vm.roll(block.number + 9);

        // User1 should get 2/3 of rewards, user2 should get 1/3
        uint256 pending1 = chef.pendingPhasor(0, user1);
        uint256 pending2 = chef.pendingPhasor(0, user2);

        // Both users share rewards proportionally over 9 blocks
        // User1 has 1000 LP, User2 has 500 LP, total 1500 LP
        // User1 gets 2/3 of 9 blocks of rewards
        uint256 expected1 = 9 * PHASOR_PER_BLOCK * 2 / 3;
        // User2 gets 1/3 of 9 blocks
        uint256 expected2 = 9 * PHASOR_PER_BLOCK / 3;

        assertEq(pending1, expected1, "User1 rewards incorrect");
        assertEq(pending2, expected2, "User2 rewards incorrect");
    }

    function testEmergencyWithdraw() public {
        // Setup: give user1 LP tokens and deposit
        vm.prank(owner);
        lpToken.transfer(user1, 1000 * 1e18);

        vm.startPrank(user1);
        lpToken.approve(address(chef), 1000 * 1e18);
        chef.deposit(0, 1000 * 1e18);
        vm.stopPrank();

        // Mine blocks to accrue rewards
        vm.roll(block.number + 10);

        // Emergency withdraw (forfeits rewards)
        vm.prank(user1);
        chef.emergencyWithdraw(0);

        (uint256 amount,) = chef.userInfo(0, user1);
        assertEq(amount, 0, "User1 should have 0 LP staked");
        assertEq(lpToken.balanceOf(user1), 1000 * 1e18, "User1 should have received all LP back");
        assertEq(phasor.balanceOf(user1), 0, "User1 should have NO PHASOR (forfeited)");
    }
}
