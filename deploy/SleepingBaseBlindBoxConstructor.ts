import {
    timeGeneration,
    readGenerateData,
} from "../utils/utils";

let generateMerkleData = readGenerateData('otherFiles/generateMerkle.json');

//SleepingBase sleepingBase_
//uint256 openAndSalesTime_
//string memory tokenUri_
//bytes32 merkleRoot_
//address verifier_
const data = [
    "0x5ab8C46e98D6f86496C0b415110ABB0Cd734F6Af",
    timeGeneration(['1689154377', '1689154377']),
    "tokenUri",
    generateMerkleData.merkleRoot,
    "0x5ab8C46e98D6f86496C0b415110ABB0Cd734F6Af",
];
export {data};