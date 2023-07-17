import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {
    deploySleepingBaseBlindBox,
    readGenerateData,
    getApprovalDigest,
    tokenIdGeneration,
    timeGeneration
} from "../utils/utils";
import {ecsign} from "ethereumjs-util";

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

            let generateMerkleData = readGenerateData('otherFiles/generateMerkle.json');

            expect(
                await sleepingBaseBlindBox.merkleRoot()
            ).eq(generateMerkleData.merkleRoot);

        });

        it("应该拥有正确的sleepingBase合约地址", async function () {
            const {sleepingBaseBlindBox, sleepingBase} = await loadFixture(deploySleepingBaseBlindBox);

            expect(
                await sleepingBaseBlindBox.sleepingBase()
            ).eq(sleepingBase.target);

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

                let generateMerkleData = readGenerateData('otherFiles/generateMerkle.json');

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
                    sleepingBaseBlindBox.mint(owner.address)
                ).not.to.be.reverted;
                await expect(
                    sleepingBaseBlindBox.connect(otherAccount).mint(otherAccount.address)
                ).to.be.reverted;

            });
        });

        describe("用户操作", function () {
            const generateMerkleData = readGenerateData('otherFiles/generateMerkle.json');

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

            it("应该不可以进行多次领取操作", async function () {
                const {sleepingBaseBlindBox, owner} = await loadFixture(deploySleepingBaseBlindBox);

                let userMerkleData = generateMerkleData.claims[owner.address];

                await expect(
                    sleepingBaseBlindBox.claim(
                        userMerkleData.index,
                        userMerkleData.amount,
                        userMerkleData.proof)
                ).not.to.be.reverted;

                await expect(
                    sleepingBaseBlindBox.claim(
                        userMerkleData.index,
                        userMerkleData.amount,
                        userMerkleData.proof)
                ).to.be.reverted;
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

                await sleepingBase.grantRole(MINTER_ROLE, sleepingBaseBlindBox.target)

                // 设置新的时间
                let time = Math.floor(Date.now() / 1000)
                await sleepingBaseBlindBox.setOpenAndSalesTime(timeGeneration([(time + 100).toString(), (time + 100).toString()]));

                // 领取盲盒
                let userMerkleData = generateMerkleData.claims[owner.address];
                await sleepingBaseBlindBox.claim(userMerkleData.index, userMerkleData.amount, userMerkleData.proof);

                // 批准盲盒的转移
                await sleepingBaseBlindBox.setApprovalForAll(otherAccount.address, true);


                let valueData = 1;
                let tokenIdsData = ["12554203470773361529372990682287675750210981929426352078871"];
                let urisData = ["test"]
                let nonce = await sleepingBaseBlindBox.nonces();
                let deadline = time * 10
                let privateKey = "0xbd1d2b53a2fafe949523b2a3bc70b82bf6005a62c29a70de81acaaf08abe3d0f";

                let digest = await getApprovalDigest(
                    "SleepingBaseBlindBox",
                    sleepingBaseBlindBox.target.toString(),
                    {
                        value: valueData,
                        tokenIds: tokenIdsData,
                        uris: urisData
                    },
                    nonce,
                    deadline
                )
                const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKey.slice(2), 'hex'))

                await expect(
                    sleepingBaseBlindBox.openBoxPermit(
                        valueData,
                        tokenIdsData,
                        urisData,
                        deadline,
                        v,
                        r,
                        s)
                ).to.be.reverted;

                let tokenId = await sleepingBaseBlindBox.tokenOfOwnerByIndex(owner.address, 0);

                await expect(
                    sleepingBaseBlindBox.transferFrom(
                        owner.address,
                        otherAccount.address,
                        tokenId)
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

                await sleepingBase.grantRole(MINTER_ROLE, sleepingBaseBlindBox.target)

                // 设置新的时间
                let time = Math.floor(Date.now() / 1000)
                await sleepingBaseBlindBox.setOpenAndSalesTime(timeGeneration([(time - 1000).toString(), (time - 1000).toString()]));

                // 领取盲盒
                let userMerkleData = generateMerkleData.claims[owner.address];
                await sleepingBaseBlindBox.claim(userMerkleData.index, userMerkleData.amount, userMerkleData.proof);

                // 批准盲盒的转移
                await sleepingBaseBlindBox.setApprovalForAll(otherAccount.address, true);

                let valueData = 1;
                let tokenIdsData = ["12554203470773361529372990682287675750210981929426352078871"];
                let urisData = ["test"]
                let nonce = await sleepingBaseBlindBox.nonces();
                let deadline = time * 10
                let privateKey = "0xbd1d2b53a2fafe949523b2a3bc70b82bf6005a62c29a70de81acaaf08abe3d0f";

                let digest = await getApprovalDigest(
                    "SleepingBaseBlindBox",
                    sleepingBaseBlindBox.target.toString(),
                    {
                        value: valueData,
                        tokenIds: tokenIdsData,
                        uris: urisData
                    },
                    nonce,
                    deadline
                )
                const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKey.slice(2), 'hex'))

                await expect(
                    sleepingBaseBlindBox.openBoxPermit(
                        valueData,
                        tokenIdsData,
                        urisData,
                        deadline,
                        v,
                        r,
                        s)
                ).not.to.be.reverted;

                let tokenId = await sleepingBaseBlindBox.tokenOfOwnerByIndex(owner.address, 0);

                await expect(
                    sleepingBaseBlindBox.transferFrom(
                        owner.address,
                        otherAccount.address,
                        tokenId)
                ).not.to.be.reverted;

            });

            it("应该不可以错误操作", async function () {
                const {
                    sleepingBaseBlindBox,
                    owner,
                    sleepingBase
                } = await loadFixture(deploySleepingBaseBlindBox);

                // 为盲盒合约增加mint权限
                let MINTER_ROLE = await sleepingBase.MINTER_ROLE()

                await sleepingBase.grantRole(MINTER_ROLE, sleepingBaseBlindBox.target)

                // 设置新的时间
                let time = Math.floor(Date.now() / 1000)
                await sleepingBaseBlindBox.setOpenAndSalesTime(timeGeneration([(time - 1000).toString(), (time - 1000).toString()]));

                // 领取盲盒
                let userMerkleData = generateMerkleData.claims[owner.address];
                await sleepingBaseBlindBox.claim(userMerkleData.index, userMerkleData.amount, userMerkleData.proof);

                let valueData = 1;
                let tokenIdsData = ["12554203470773361529372990682287675750210981929426352078871"];
                let urisData = ["test"]
                let nonce = await sleepingBaseBlindBox.nonces();
                let deadline = time * 10
                let privateKey = "0xbd1d2b53a2fafe949523b2a3bc70b82bf6005a62c29a70de81acaaf08abe3d0f";

                let digest = await getApprovalDigest(
                    "SleepingBaseBlindBox",
                    sleepingBaseBlindBox.target,
                    {
                        value: valueData,
                        tokenIds: tokenIdsData,
                        uris: urisData
                    },
                    nonce,
                    deadline
                )
                const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKey.slice(2), 'hex'))

                await expect(
                    sleepingBaseBlindBox.openBoxPermit(
                        valueData + 1,
                        tokenIdsData,
                        urisData,
                        deadline + 100,
                        v,
                        r,
                        s)
                ).to.be.reverted;

            });
        });
    });
});