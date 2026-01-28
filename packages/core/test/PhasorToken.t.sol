// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/token/PhasorToken.sol";

contract PhasorTokenTest is Test {
    PhasorToken public token;
    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        vm.startPrank(owner);
        token = new PhasorToken();
        vm.stopPrank();
    }

    function testInitialSupply() public view {
        assertEq(token.totalSupply(), 100_000_000 * 1e18, "Initial supply should be 100M");
        assertEq(token.balanceOf(owner), 100_000_000 * 1e18, "Owner should have initial supply");
    }

    function testMint() public {
        vm.prank(owner);
        token.mint(user, 1000 * 1e18);
        assertEq(token.balanceOf(user), 1000 * 1e18, "User should receive minted tokens");
    }

    function testOnlyOwnerCanMint() public {
        vm.prank(user);
        vm.expectRevert();
        token.mint(user, 1000 * 1e18);
    }

    function testMaxSupply() public {
        uint256 maxSupply = token.MAX_SUPPLY();
        uint256 remaining = maxSupply - token.totalSupply();

        vm.prank(owner);
        token.mint(user, remaining);
        assertEq(token.totalSupply(), maxSupply, "Should reach max supply");

        // Try to mint more
        vm.prank(owner);
        vm.expectRevert("PhasorToken: exceeds max supply");
        token.mint(user, 1);
    }
}
