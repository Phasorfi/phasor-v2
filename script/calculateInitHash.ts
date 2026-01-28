// scripts/getPoolInitCodeHash.ts
import { bytecode } from "../out/UniswapV2Pair.sol/UniswapV2Pair.json"
import { keccak256 } from "ethers";
import * as fs from "fs";

function getPoolInitCodeHash() {
 const COMPUTED_INIT_CODE_HASH = keccak256(bytecode.object)
 console.log(COMPUTED_INIT_CODE_HASH)

 // Update UniswapV2Library.sol
 const libraryFile = "packages/periphery/contracts/libraries/UniswapV2Library.sol";
 let content = fs.readFileSync(libraryFile, 'utf8');
 const hashPattern = /hex'[0-9a-f]{64}'/;
 const newHash = `hex'${COMPUTED_INIT_CODE_HASH.slice(2)}'`;

 if (hashPattern.test(content)) {
   content = content.replace(hashPattern, newHash);
   fs.writeFileSync(libraryFile, content);
   console.log(`Updated INIT_CODE_HASH in ${libraryFile}`);
 } else {
   console.error(`Could not find INIT_CODE_HASH pattern in ${libraryFile}`);
   process.exit(1);
 }

 return COMPUTED_INIT_CODE_HASH;
}

getPoolInitCodeHash()