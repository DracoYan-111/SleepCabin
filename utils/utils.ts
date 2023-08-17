import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {defaultAbiCoder} from "@ethersproject/abi";
import {pack} from "@ethersproject/solidity";
import {execSync} from "child_process";
import * as ethersUtils from 'ethers';
import {ethers} from "hardhat";
import fs from "fs";

export const PERMIT_TYPEHASH = ethersUtils.keccak256(
    ethersUtils.toUtf8Bytes('openBoxPermit(uint256 amount, address userAddress, uint256[] calldata tokenIds, string[] calldata uris, uint256 nonce, uint deadline)')
)
export const PERMIT_TYPEHASH_TWO = ethersUtils.keccak256(
    ethersUtils.toUtf8Bytes('userMintPermit(address userAddress, uint256 paymentAmount, uint256[] calldata tokenIds, uint256 nonce, uint deadline)')
)
export const PRIVATEKEY = "0xbd1d2b53a2fafe949523b2a3bc70b82bf6005a62c29a70de81acaaf08abe3d0f";


export function getDomainSeparator(name: string, tokenAddress: string) {
    return ethersUtils.keccak256(
        defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [
                ethersUtils.keccak256(
                    ethersUtils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
                ),
                ethersUtils.keccak256(ethersUtils.toUtf8Bytes(name)),
                ethersUtils.keccak256(ethersUtils.toUtf8Bytes('1')),
                10086,
                tokenAddress,
            ]
        )
    )
}

// 生成OpenBox方法所需的签名
export async function getOpenBoxDigest(
    tokenName: string,
    tokenAddress: string,
    permit: {
        amount: bigint;
        address: string;
        tokenIds: string[];
        uris: string[]
    },
    nonce: number,
    deadline: number
): Promise<string> {
    const DOMAIN_SEPARATOR = getDomainSeparator(tokenName, tokenAddress)
    return ethersUtils.keccak256(
        pack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
                '0x19',
                '0x01',
                DOMAIN_SEPARATOR,
                ethersUtils.keccak256(
                    defaultAbiCoder.encode(
                        ['bytes32', 'uint256', "address", 'uint256[]', 'string[]', 'uint256', 'uint256'],
                        [
                            PERMIT_TYPEHASH,
                            permit.amount,
                            permit.address,
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

// 生成UserMint方法所需的签名
export async function getUserMintDigest(
    tokenName: string,
    tokenAddress: string,
    permit: {
        address: string;
        paymentAmount: bigint;
        tokenIds: string[]
    },
    nonce: number,
    deadline: number
): Promise<string> {
    const DOMAIN_SEPARATOR = getDomainSeparator(tokenName, tokenAddress)
    return ethersUtils.keccak256(
        pack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
                '0x19',
                '0x01',
                DOMAIN_SEPARATOR,
                ethersUtils.keccak256(
                    defaultAbiCoder.encode(
                        ['bytes32', "address", 'uint256', 'uint256[]', 'uint256', 'uint256'],
                        [
                            PERMIT_TYPEHASH_TWO,
                            permit.address,
                            permit.paymentAmount,
                            permit.tokenIds,
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
    let generateMerkleData = readGenerateData('otherFiles/generateMerkle.json');


    const sleepingBaseBlindBox = await SleepingBaseBlindBox.deploy(
        sleepingBase.getAddress(),
        openAndSalesTime,
        tokenUri,
        generateMerkleData.merkleRoot,
        "0x5ab8C46e98D6f86496C0b415110ABB0Cd734F6Af"
    );

    return {sleepingBaseBlindBox, owner, otherAccount, sleepingBase, openAndSalesTime};
}

// 部署 SleepingBaseBlindBox 合约
export async function deploySleepingBaseBlindBoxNew() {
    const [owner, otherAccount] = await ethers.getSigners();

    const SleepingBaseBlindBox = await ethers.getContractFactory("contracts/SleepingBaseBlindBox.sol:SleepingBaseBlindBox");

    const {sleepingBase} = await loadFixture(deploySleepingBase);
    let time = Math.floor(Date.now() / 1000)
    let openAndSalesTime = timeGeneration([(time + 1000).toString(), (time + 2000).toString()]);
    let tokenUri = "{\"image\": \"ipfs://QmdrJ3qoFpAw6s6cxh3JNXyrURo3UopF6p5B2ma3ZB8kTc/FCB_MASTERPIECE2_STATIC.png\"}"

    const sleepingBaseBlindBox = await SleepingBaseBlindBox.deploy(
        sleepingBase.getAddress(),
        openAndSalesTime,
        tokenUri,
        "0x5ab8C46e98D6f86496C0b415110ABB0Cd734F6Af",
        "0x5ab8C46e98D6f86496C0b415110ABB0Cd734F6Af"
    );

    return {sleepingBaseBlindBox, owner, otherAccount, sleepingBase, openAndSalesTime};
}

// 打包tokenId和其属性的打包值
export function tokenIdGeneration(ages: string[]): bigint {
    let tokenId: bigint = 0n;

    for (let i = 0; i < ages.length; i++) {
        const ageBigInt: bigint = BigInt(ages[i]);
        tokenId |= ageBigInt << (BigInt(i) * 32n);
    }

    return tokenId;
}

// 解析tokenId和其属性的打包值
export function tokenIdAnalysis(data: bigint): [bigint, bigint, bigint, bigint, bigint, bigint] {
    const ages: bigint[] = [];
    const mask = BigInt(2 ** 32 - 1);

    for (let i = 0; i < 6; i++) {
        const age = (data >> BigInt(i * 32)) & mask;
        ages.push(age);
    }

    return ages;
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
export function readGenerateData(filePath: string): any {
    try {
        const fileData = fs.readFileSync(filePath, {encoding: 'utf8'});

        return JSON.parse(fileData);
    } catch (error) {
        console.error('Error reading generateMerkle.json:', error);
        return null;
    }
}