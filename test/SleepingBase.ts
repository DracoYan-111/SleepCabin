import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {
    deploySleepingBase,
    tokenIdGeneration,
    tokenIdAnalysis
} from "../utils/utils";

describe("SleepingBase", function () {
    describe("检查类", function () {
        it("应该拥有正确的合约最高权限", async function () {
            const {sleepingBase, owner} = await loadFixture(deploySleepingBase);
            let DEFAULT_ADMIN_ROLE = await sleepingBase.DEFAULT_ADMIN_ROLE()

            expect(
                await sleepingBase.hasRole(DEFAULT_ADMIN_ROLE, owner.address)
            ).to.be.true;

        });

        it("应该拥有正确的合约mint权限", async function () {
            const {sleepingBase, owner} = await loadFixture(deploySleepingBase);
            let MINTER_ROLE = await sleepingBase.MINTER_ROLE()

            expect(
                await sleepingBase.hasRole(MINTER_ROLE, owner.address)
            ).to.be.true;

        });
    });

    describe("操作类", function () {
        describe("权限", function () {
            it("应该可以增加他人权限,他人相反", async function () {
                const {sleepingBase, otherAccount} = await loadFixture(deploySleepingBase);

                let MINTER_ROLE = await sleepingBase.MINTER_ROLE()

                await expect(
                    sleepingBase.grantRole(MINTER_ROLE, otherAccount.address)
                ).not.to.be.reverted

                await expect(
                    sleepingBase.connect(otherAccount).grantRole(MINTER_ROLE, otherAccount.address)
                ).to.be.reverted;

            });

            it("应该可以暂停开启,他人相反", async function () {
                const {sleepingBase, otherAccount} = await loadFixture(deploySleepingBase);

                await expect(sleepingBase.pause()).not.to.be.reverted;
                await expect(sleepingBase.unpause()).not.to.be.reverted;

                await expect(
                    sleepingBase.connect(otherAccount).pause()
                ).to.be.reverted;

                await expect(
                    sleepingBase.connect(otherAccount).unpause()
                ).to.be.reverted;

            });

            it("应该可以放弃权限", async function () {
                const {sleepingBase, owner} = await loadFixture(deploySleepingBase);

                let DEFAULT_ADMIN_ROLE = await sleepingBase.DEFAULT_ADMIN_ROLE()
                let MINTER_ROLE = await sleepingBase.MINTER_ROLE()

                await expect(
                    sleepingBase.renounceRole(DEFAULT_ADMIN_ROLE, owner.address)
                ).not.to.be.reverted;

                await expect(
                    sleepingBase.renounceRole(MINTER_ROLE, owner.address)
                ).not.to.be.reverted;

            });

            it("应该可以撤销他人权限,他人相反", async function () {
                const {sleepingBase, owner, otherAccount} = await loadFixture(deploySleepingBase);

                let MINTER_ROLE = await sleepingBase.MINTER_ROLE()
                // 设置mint权限
                await sleepingBase.grantRole(MINTER_ROLE, otherAccount.address)

                await expect(
                    sleepingBase.revokeRole(MINTER_ROLE, otherAccount.address)
                ).not.to.be.reverted;

                await expect(
                    sleepingBase.connect(otherAccount).revokeRole(MINTER_ROLE, owner.address)
                ).to.be.reverted;

            });


            it("应该可以进行增发操作,他人相反", async function () {
                const {sleepingBase, owner, otherAccount} = await loadFixture(deploySleepingBase);

                let combinedData = tokenIdGeneration(['2', '5', '68', '34', '76'])

                await expect(
                    sleepingBase.safeMint(
                        owner.address,
                        [combinedData],
                        ["test"])
                ).not.to.be.reverted;

                await expect(
                    sleepingBase.connect(otherAccount).safeMint(
                        owner.address,
                        [combinedData],
                        ["test"])
                ).to.be.reverted;

            });

            it("应该可以进行销毁操作,他人相反", async function () {
                const {sleepingBase, owner, otherAccount} = await loadFixture(deploySleepingBase);

                let combinedData = tokenIdGeneration(['2', '5', '68', '34', '76'])
                let [tokenId] = tokenIdAnalysis(combinedData);

                await sleepingBase.safeMint(owner.address, [combinedData], ["test"])

                await expect(
                    sleepingBase.safeBurn(tokenId)
                ).not.to.be.reverted;

                await expect(
                    sleepingBase.connect(otherAccount).safeBurn(tokenId)
                ).to.be.reverted;

            });

            it("应该可以进行URI修改,他人相反", async function () {
                const {sleepingBase, owner, otherAccount} = await loadFixture(deploySleepingBase);

                let combinedData = tokenIdGeneration(['2', '5', '68', '34', '76'])
                let [tokenId] = tokenIdAnalysis(combinedData);

                await sleepingBase.safeMint(owner.address, [combinedData], ["test"])

                await expect(
                    sleepingBase.setTokenUri(tokenId, "test1")
                ).not.to.be.reverted;

                await expect(
                    sleepingBase.connect(otherAccount).setTokenUri(tokenId, "test1")
                ).to.be.reverted;
            });
        });

        describe("转账", function () {
            it("NFT拥有者应该可以转账", async function () {
                const {sleepingBase, owner, otherAccount} = await loadFixture(deploySleepingBase);

                let combinedData = tokenIdGeneration(['2', '5', '68', '34', '76']);

                await sleepingBase.safeMint(owner.address, [combinedData], ["test"]);

                let [tokenId] = tokenIdAnalysis(combinedData);
                // 批转nft的转移
                await sleepingBase.setApprovalForAll(otherAccount.address, true);

                await expect(
                    sleepingBase.transferFrom(
                        owner.address,
                        otherAccount.address,
                        tokenId)
                ).not.to.be.reverted;
            });

            it("NFT未拥有者不应该可以转账", async function () {
                const {sleepingBase, owner, otherAccount} = await loadFixture(deploySleepingBase);

                let combinedData = tokenIdGeneration(['2', '5', '68', '34', '76']);
                let [tokenId] = tokenIdAnalysis(combinedData);
                // 批转nft的转移
                await sleepingBase.connect(otherAccount).setApprovalForAll(owner.address, true);

                await expect(
                    sleepingBase.connect(otherAccount).transferFrom(
                        otherAccount.address,
                        owner.address,
                        tokenId)
                ).to.be.reverted;
            });
        });
    });
});
