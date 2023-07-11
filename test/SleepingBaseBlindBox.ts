import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {
    deploySleepingBaseBlindBox,
    tokenIdGeneration,
    timeGeneration,
    readGenerateMerkleData
} from "../utils/utils";

describe("SleepingBaseBlindBox", function () {

    describe("检查类", function () {
        it("应该拥有正确的合约最高权限", async function () {
            const {sleepingBaseBlindBox, owner} = await loadFixture(deploySleepingBaseBlindBox);

            expect(
                await sleepingBaseBlindBox.owner()
            ).eq(owner.address);

        });

        it("应该拥有正确的merkleRoot", async function () {
            const {sleepingBaseBlindBox} = await loadFixture(deploySleepingBaseBlindBox);

            let generateMerkleData = readGenerateMerkleData();

            expect(
                await sleepingBaseBlindBox.merkleRoot()
            ).eq(generateMerkleData.merkleRoot);

        });

        it("应该拥有正确的sleepingBase合约地址", async function () {
            const {sleepingBaseBlindBox, sleepingBase} = await loadFixture(deploySleepingBaseBlindBox);

            expect(
                await sleepingBaseBlindBox.sleepingBase()
            ).eq(sleepingBase.address);

        });
    });

    describe("操作类", function () {
        describe("权限", function () {
            it("应该可以暂停开启合约,他人相反", async function () {
                const {sleepingBaseBlindBox, otherAccount} = await loadFixture(deploySleepingBaseBlindBox);

                await expect(
                    sleepingBaseBlindBox.connect(otherAccount).pause()
                ).to.be.reverted;
                await expect
                (sleepingBaseBlindBox.pause()
                ).not.to.be.reverted

                await expect(
                    sleepingBaseBlindBox.connect(otherAccount).unpause()
                ).to.be.reverted;
                await expect(
                    sleepingBaseBlindBox.unpause()
                ).not.to.be.reverted

            });

            it("应该可以修改时间,他人相反", async function () {
                const {sleepingBaseBlindBox, otherAccount} = await loadFixture(deploySleepingBaseBlindBox);

                await expect(
                    sleepingBaseBlindBox.connect(otherAccount).setOpenAndSalesTime(timeGeneration(["1688710482", "1688710482"]))
                ).to.be.reverted;
                await expect(
                    sleepingBaseBlindBox.setOpenAndSalesTime(timeGeneration(["1688710482", "1688710482"]))
                ).not.to.be.reverted
            });

            it("应该可以放弃权限和转移权限,他人相反", async function () {
                const {sleepingBaseBlindBox, owner, otherAccount} = await loadFixture(deploySleepingBaseBlindBox);

                await expect(
                    sleepingBaseBlindBox.transferOwnership(owner.address)
                ).not.to.be.reverted;
                await expect(
                    sleepingBaseBlindBox.connect(otherAccount).transferOwnership(owner.address)
                ).to.be.reverted;

                await expect(
                    sleepingBaseBlindBox.renounceOwnership()
                ).not.to.be.reverted;
                await expect(
                    sleepingBaseBlindBox.connect(otherAccount).renounceOwnership()
                ).to.be.reverted;

            });

            it("应该可以修改merkleRoot,他人相反", async function () {
                const {sleepingBaseBlindBox, otherAccount} = await loadFixture(deploySleepingBaseBlindBox);

                let generateMerkleData = readGenerateMerkleData();

                await expect(
                    sleepingBaseBlindBox.setMerkleRoot(generateMerkleData.merkleRoot)
                ).not.to.be.reverted;
                await expect(
                    sleepingBaseBlindBox.connect(otherAccount).setMerkleRoot(generateMerkleData.merkleRoot)
                ).to.be.reverted;

            });

            it("应该可以进行增发操作,他人相反", async function () {
                const {sleepingBaseBlindBox, owner, otherAccount} = await loadFixture(deploySleepingBaseBlindBox);

                await expect(
                    sleepingBaseBlindBox.mint(owner.address, 99)
                ).not.to.be.reverted;
                await expect(
                    sleepingBaseBlindBox.connect(otherAccount).mint(otherAccount.address, 99)
                ).to.be.reverted;

            });
        });

        describe("用户操作", function () {
            const generateMerkleData = readGenerateMerkleData();

            it("应该可以进行正确的领取操作", async function () {
                const {sleepingBaseBlindBox, owner} = await loadFixture(deploySleepingBaseBlindBox);

                let userMerkleData = generateMerkleData.claims[owner.address];

                await expect(
                    sleepingBaseBlindBox.claim(
                        (userMerkleData.index + 1),
                        (userMerkleData.amount + 10),
                        userMerkleData.proof)
                ).to.be.reverted;
                await expect(
                    sleepingBaseBlindBox.claim(
                        userMerkleData.index,
                        userMerkleData.amount,
                        userMerkleData.proof)
                ).not.to.be.reverted;

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