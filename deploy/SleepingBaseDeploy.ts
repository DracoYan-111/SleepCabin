import {ethers} from "hardhat";
import fs from 'fs';
import {
    deploySleepingBase, readGenerateData,
    timeGeneration
} from "../utils/utils";

const data = {
    sleepingBase: "",
    openAndSalesTime: "",
    tokenUri: "",
    merkleRoot: "",
    verifier: ""
};

async function main() {
    let generateMerkleData = readGenerateData('otherFiles/generateMerkle.json');

    const {sleepingBase, owner} = await deploySleepingBase();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
