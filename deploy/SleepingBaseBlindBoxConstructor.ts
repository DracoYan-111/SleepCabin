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
    "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    timeGeneration(['1691643714', '1691643714']),
    "tokenUri",
    generateMerkleData.merkleRoot,
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
];
export {data};