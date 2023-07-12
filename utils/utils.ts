import {execSync} from "child_process";
import {BigNumber, providers, utils} from 'ethers'
import fs from "fs";
import {ethers} from "hardhat";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";

export const PERMIT_TYPEHASH = utils.keccak256(
    utils.toUtf8Bytes('openBoxPermit(uint256 amount, uint256[] calldata tokenIds, string[] calldata uris, uint256 nonce, uint deadline)')
)


export function getDomainSeparator(name: string, tokenAddress: string) {
    return utils.keccak256(
        utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [
                utils.keccak256(
                    utils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
                ),
                utils.keccak256(utils.toUtf8Bytes(name)),
                utils.keccak256(utils.toUtf8Bytes('1')),
                10086,
                tokenAddress,
            ]
        )
    )
}

export async function getApprovalDigest(
    tokenName: string,
    tokenAddress: string,
    permit: { uris: string[]; tokenIds: string[]; value: number },
    nonce: number,
    deadline: number
): Promise<string> {
    const DOMAIN_SEPARATOR = getDomainSeparator(tokenName, tokenAddress)
    return utils.keccak256(
        utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
                '0x19',
                '0x01',
                DOMAIN_SEPARATOR,
                utils.keccak256(
                    utils.defaultAbiCoder.encode(
                        ['bytes32', 'uint256', 'uint256[]', 'string[]', 'uint256', 'uint256'],
                        [
                            PERMIT_TYPEHASH,
                            permit.value,
                            permit.tokenIds,
                            permit.uris,
                            nonce,
                            deadline
                        ]
                    )
                ),
            ]
        )
    )
}

// 部署 SleepingBase 合约
export async function deploySleepingBase() {
    const [owner, otherAccount] = await ethers.getSigners();

    const SleepingBase = await ethers.getContractFactory("contracts/SleepingBase.sol:SleepingBase");
    const sleepingBase = await SleepingBase.deploy();

    return {sleepingBase, owner, otherAccount};
}

// 部署 SleepingBaseBlindBox 合约
export async function deploySleepingBaseBlindBox() {
    const [owner, otherAccount] = await ethers.getSigners();

    const SleepingBaseBlindBox = await ethers.getContractFactory("contracts/SleepingBaseBlindBoxFacelift.sol:SleepingBaseBlindBox");

    runGenerateMerkleRoot();
    const {sleepingBase} = await loadFixture(deploySleepingBase);
    let time = Math.floor(Date.now() / 1000)
    let openAndSalesTime = timeGeneration([(time + 1000).toString(), (time + 2000).toString()]);
    let tokenUri = "{\"image\": \"ipfs://QmdrJ3qoFpAw6s6cxh3JNXyrURo3UopF6p5B2ma3ZB8kTc/FCB_MASTERPIECE2_STATIC.png\"}"
    let generateMerkleData = readGenerateMerkleData();


    const sleepingBaseBlindBox = await SleepingBaseBlindBox.deploy(
        sleepingBase.address,
        openAndSalesTime,
        tokenUri,
        generateMerkleData.merkleRoot,
        "0x5ab8C46e98D6f86496C0b415110ABB0Cd734F6Af"
    );

    return {sleepingBaseBlindBox, owner, otherAccount, sleepingBase, openAndSalesTime};
}

// 打包tokenId和其属性的打包值
export function tokenIdGeneration(ages: string[]): bigint {
    const value1: bigint = BigInt(ages[0]); // 替换为正确的 tokenID
    const value2: bigint = BigInt(ages[1]); // 替换为正确的 token 稀有度
    const value3: bigint = BigInt(ages[2]); // 替换为正确的 token 心情值
    const value4: bigint = BigInt(ages[3]); // 替换为正确的 token 幸运值
    const value5: bigint = BigInt(ages[4]); // 替换为正确的 token 舒适度

    const shift192: bigint = value1 << 192n;
    const shift128: bigint = value2 << 128n;
    const shift96: bigint = value3 << 96n;
    const shift64: bigint = value4 << 64n;

    return shift192 | shift128 | shift96 | shift64 | value5
}

// 解析tokenId和其属性的打包值
export function tokenIdAnalysis(data: bigint): [bigint, bigint, bigint, bigint, bigint] {
    const tokenId: bigint = data >> 192n;
    const rarityValue: bigint = (data >> 128n) & ((1n << 64n) - 1n);
    const moodValue: bigint = (data >> 96n) & ((1n << 32n) - 1n);
    const luckyValue: bigint = (data >> 64n) & ((1n << 32n) - 1n);
    const comfortValue: bigint = data & ((1n << 64n) - 1n);

    return [tokenId, rarityValue, moodValue, luckyValue, comfortValue];
}

// 生成打开时间和交易时间的打包值
export function timeGeneration(aegs: string[]): bigint {
    const value1: bigint = BigInt(aegs[0]); // 替换为正确的 open 时间
    const value2: bigint = BigInt(aegs[1]); // 替换为正确的 sales 时间

    const shift128: bigint = value1 << 128n;

    return shift128 | value2
}

// 解析打开时间和交易时间的打包值
export function timeAnalysis(data: bigint): [bigint, bigint] {
    const openTime: bigint = BigInt(Number(data >> 128n));
    const salesTime: bigint = BigInt(Number(data));

    return [openTime, salesTime];
}

// 生成默克尔根到文件中
export function runGenerateMerkleRoot(): void {
    try {
        const command = 'ts-node scripts/generate-merkle-root.ts --input otherFiles/complex_example.json';
        const output = execSync(command, {encoding: 'utf8'});

        //console.log(output);
    } catch (error) {
        console.error('Error executing command:', error);
    }
}

// 获取文件中的默克尔信息
export function readGenerateMerkleData(): any {
    try {
        const filePath = 'otherFiles/generateMerkle.json';
        const fileData = fs.readFileSync(filePath, {encoding: 'utf8'});

        return JSON.parse(fileData);
    } catch (error) {
        console.error('Error reading generateMerkle.json:', error);
        return null;
    }
}