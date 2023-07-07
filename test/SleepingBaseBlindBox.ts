import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {execSync} from 'child_process';
import {expect} from "chai";
import {ethers} from "hardhat";
import fs from 'fs';


describe("SleepingBase", function () {
    // 生成tokenId和其属性的打包值
    function tokenIdGeneration(ages: string[]): bigint {
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
    function tokenIdAnalysis(data: bigint): [bigint, bigint, bigint, bigint, bigint] {
        const tokenId: bigint = data >> 192n;
        const rarityValue: bigint = (data >> 128n) & ((1n << 64n) - 1n);
        const moodValue: bigint = (data >> 96n) & ((1n << 32n) - 1n);
        const luckyValue: bigint = (data >> 64n) & ((1n << 32n) - 1n);
        const comfortValue: bigint = data & ((1n << 64n) - 1n);

        return [tokenId, rarityValue, moodValue, luckyValue, comfortValue];
    }

    // 生成打开时间和交易时间的打包值
    function timeGeneration(aegs: string[]): bigint {
        const value1: bigint = BigInt(aegs[0]); // 替换为正确的 open 时间
        const value2: bigint = BigInt(aegs[1]); // 替换为正确的 sales 时间

        const shift128: bigint = value1 << 128n;

        return shift128 | value2
    }

    // 解析打开时间和交易时间的打包值
    function timeAnalysis(data: bigint): [bigint, bigint] {
        const openTime: bigint = BigInt(Number(data >> 128n));
        const salesTime: bigint = BigInt(Number(data));

        return [openTime, salesTime];
    }

    // 生成默克尔根到文件中
    function runGenerateMerkleRoot(): void {
        try {
            const command = 'ts-node scripts/generate-merkle-root.ts --input scripts/complex_example.json';
            const output = execSync(command, {encoding: 'utf8'});

            console.log(output);
        } catch (error) {
            console.error('Error executing command:', error);
        }
    }

    // 获取文件中的默克尔信息
    function readGenerateMerkleData(): any {
        try {
            const filePath = 'otherFiles/generateMerkle.json';
            const fileData = fs.readFileSync(filePath, {encoding: 'utf8'});

            return JSON.parse(fileData);
        } catch (error) {
            console.error('Error reading generateMerkle.json:', error);
            return null;
        }
    }

    async function deploySleepingBase() {
        const [owner, otherAccount] = await ethers.getSigners();

        const SleepingBase = await ethers.getContractFactory("contracts/SleepingBase.sol:SleepingBase");
        const sleepingBase = await SleepingBase.deploy();

        return {sleepingBase, owner, otherAccount};
    }

    async function deploySleepingBaseBlindBox() {
        const [owner, otherAccount] = await ethers.getSigners();

        const SleepingBaseBlindBox = await ethers.getContractFactory("contracts/SleepingBaseBlindBox.sol:SleepingBaseBlindBox");

        //runGenerateMerkleRoot();
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
            999
        );

        return {sleepingBaseBlindBox, owner, otherAccount, sleepingBase, openAndSalesTime};
    }

    describe("检查类", function () {
        it("应该拥有正确的合约最高权限", async function () {
            const {sleepingBaseBlindBox, owner} = await loadFixture(deploySleepingBaseBlindBox);

            expect(await sleepingBaseBlindBox.owner()).eq(owner.address);
        });

        it("应该拥有正确的merkleRoot", async function () {
            const {sleepingBaseBlindBox} = await loadFixture(deploySleepingBaseBlindBox);

            let generateMerkleData = readGenerateMerkleData();

            expect(await sleepingBaseBlindBox.merkleRoot()).eq(generateMerkleData.merkleRoot);
        });

        it("应该拥有正确的sleepingBase合约地址", async function () {
            const {sleepingBaseBlindBox, sleepingBase} = await loadFixture(deploySleepingBaseBlindBox);

            expect(await sleepingBaseBlindBox.sleepingBase()).eq(sleepingBase.address);
        });
    });

    describe("操作类", function () {
        describe("权限", function () {
            it("应该可以暂停开启合约,他人相反", async function () {
                const {sleepingBaseBlindBox, otherAccount} = await loadFixture(deploySleepingBaseBlindBox);

                await expect(sleepingBaseBlindBox.connect(otherAccount).pause()).to.be.reverted;
                await expect(sleepingBaseBlindBox.pause()).not.to.be.reverted

                await expect(sleepingBaseBlindBox.connect(otherAccount).unpause()).to.be.reverted;
                await expect(sleepingBaseBlindBox.unpause()).not.to.be.reverted
            });

            it("应该可以修改时间,他人相反", async function () {
                const {sleepingBaseBlindBox, otherAccount} = await loadFixture(deploySleepingBaseBlindBox);

                await expect(sleepingBaseBlindBox.connect(otherAccount).setOpenAndSalesTime(timeGeneration(["1688710482", "1688710482"]))).to.be.reverted;
                await expect(sleepingBaseBlindBox.setOpenAndSalesTime(timeGeneration(["1688710482", "1688710482"]))).not.to.be.reverted
            });

            it("应该可以放弃权限和转移权限,他人相反", async function () {
                const {sleepingBaseBlindBox, owner, otherAccount} = await loadFixture(deploySleepingBaseBlindBox);
                await expect(sleepingBaseBlindBox.transferOwnership(owner.address)).not.to.be.reverted;
                await expect(sleepingBaseBlindBox.connect(otherAccount).transferOwnership(owner.address)).to.be.reverted;

                await expect(sleepingBaseBlindBox.renounceOwnership()).not.to.be.reverted;
                await expect(sleepingBaseBlindBox.connect(otherAccount).renounceOwnership()).to.be.reverted;
            });

            it("应该可以修改merkleRoot,他人相反", async function () {
                const {sleepingBaseBlindBox, otherAccount} = await loadFixture(deploySleepingBaseBlindBox);

                let generateMerkleData = readGenerateMerkleData();

                await expect(sleepingBaseBlindBox.setMerkleRoot(generateMerkleData.merkleRoot)).not.to.be.reverted;
                await expect(sleepingBaseBlindBox.connect(otherAccount).setMerkleRoot(generateMerkleData.merkleRoot)).to.be.reverted;
            });

            it("因该可以进行增发操作,他人相反", async function () {
                const {sleepingBaseBlindBox, owner, otherAccount} = await loadFixture(deploySleepingBaseBlindBox);

                await expect(sleepingBaseBlindBox.mint(owner.address, 99)).not.to.be.reverted;
                await expect(sleepingBaseBlindBox.connect(otherAccount).mint(otherAccount.address, 99)).to.be.reverted;

            });
        });

        describe("用户操作", function () {
            const generateMerkleData = readGenerateMerkleData();

            it("因该可以进行正确的领取操作", async function () {
                const {sleepingBaseBlindBox, owner} = await loadFixture(deploySleepingBaseBlindBox);

                let userMerkleData = generateMerkleData.claims[owner.address];

                await expect(sleepingBaseBlindBox.claim((userMerkleData.index + 1), (userMerkleData.amount + 10), userMerkleData.proof)).to.be.reverted;
                await expect(sleepingBaseBlindBox.claim(userMerkleData.index, userMerkleData.amount, userMerkleData.proof)).not.to.be.reverted;
            });

            it("未到时间应该不可以操作", async function () {
                const {
                    sleepingBaseBlindBox,
                    owner,
                    otherAccount,
                    sleepingBase
                } = await loadFixture(deploySleepingBaseBlindBox);

                // 为盲盒合约增加mint权限
                let MINTER_ROLE = await sleepingBase.MINTER_ROLE()

                await sleepingBase.grantRole(MINTER_ROLE, sleepingBaseBlindBox.address)

                // 设置新的时间
                let time = Math.floor(Date.now() / 1000)
                await sleepingBaseBlindBox.setOpenAndSalesTime(timeGeneration([(time + 100).toString(), (time + 100).toString()]));

                // 领取盲盒
                let userMerkleData = generateMerkleData.claims[owner.address];
                await sleepingBaseBlindBox.claim(userMerkleData.index, userMerkleData.amount, userMerkleData.proof);

                // 批转盲盒的转移
                await sleepingBaseBlindBox.setApprovalForAll(otherAccount.address, true);

                await expect(
                    sleepingBaseBlindBox.openBox(
                        2,
                        [tokenIdGeneration(["3", "4", "23", "45", "34"]), tokenIdGeneration(["4", "3", "32", "45", "33"])],
                        ["test", "test"])
                ).to.be.reverted;

                await expect(
                    sleepingBaseBlindBox.safeTransferFrom(
                        owner.address,
                        otherAccount.address,
                        0,
                        1,
                        "0x")
                ).to.be.reverted;
            });

            it("到时间应该可以操作", async function () {
                const {
                    sleepingBaseBlindBox,
                    owner,
                    otherAccount,
                    sleepingBase
                } = await loadFixture(deploySleepingBaseBlindBox);

                // 为盲盒合约增加mint权限
                let MINTER_ROLE = await sleepingBase.MINTER_ROLE()

                await sleepingBase.grantRole(MINTER_ROLE, sleepingBaseBlindBox.address)

                // 设置新的时间
                let time = Math.floor(Date.now() / 1000)
                await sleepingBaseBlindBox.setOpenAndSalesTime(timeGeneration([(time - 100).toString(), (time - 100).toString()]));

                // 领取盲盒
                let userMerkleData = generateMerkleData.claims[owner.address];
                await sleepingBaseBlindBox.claim(userMerkleData.index, userMerkleData.amount, userMerkleData.proof);

                // 批转盲盒的转移
                await sleepingBaseBlindBox.setApprovalForAll(otherAccount.address, true);

                await expect(
                    sleepingBaseBlindBox.openBox(
                        2,
                        [tokenIdGeneration(["3", "4", "23", "45", "34"]), tokenIdGeneration(["4", "3", "32", "45", "33"])],
                        ["test", "test"])
                ).not.to.be.reverted;

                await expect(
                    sleepingBaseBlindBox.safeTransferFrom(
                        owner.address,
                        otherAccount.address,
                        0,
                        1,
                        "0x")
                ).not.to.be.reverted;
            });

        });
    });
});
