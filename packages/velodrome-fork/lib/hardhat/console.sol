// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

library console {
    function log(string memory) internal pure {}
    function log(string memory, string memory) internal pure {}
    function log(string memory, uint256) internal pure {}
    function log(string memory, address) internal pure {}
    function log(string memory, bool) internal pure {}
    function log(uint256) internal pure {}
    function log(address) internal pure {}
    function log(bool) internal pure {}
    function log(string memory, string memory, string memory) internal pure {}
    function log(string memory, string memory, uint256) internal pure {}
    function log(string memory, uint256, string memory) internal pure {}
    function log(string memory, uint256, uint256) internal pure {}
    function logBytes(bytes memory) internal pure {}
    function logBytes32(bytes32) internal pure {}
}
