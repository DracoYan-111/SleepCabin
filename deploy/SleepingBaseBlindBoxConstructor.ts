import {
    timeGeneration,
    readGenerateData,
} from "../utils/utils";

let deployments = readGenerateData('deployments/localhost_deployment.json');
let generateMerkleData = readGenerateData('otherFiles/generateMerkle.json');

const data = [
    deployments.address,                                  //SleepingBase sleepingBase_
    timeGeneration(['1689154377', '1689154377']),   //uint256 openAndSalesTime_
    "tokenUri",                                           //string memory tokenUri_
    generateMerkleData.merkleRoot,                        //bytes32 merkleRoot_
    deployments.receipt["from"],                          //address verifier_

];
export {data};