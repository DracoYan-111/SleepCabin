import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {
    deploySleepingBaseBlindBox,
    readGenerateData,
    getOpenBoxDigest,
    tokenIdGeneration,
    timeGeneration,
    timeAnalysis,
    PRIVATEKEY,
    deploySleepingBaseBlindBoxNew,
    getUserMintDigest
} from "../utils/utils";
import {ecsign} from "ethereumjs-util";
import {time} from "@nomicfoundation/hardhat-toolbox/network-helpers";


let times = Math.floor(Date.now() / 1000)

describe("SleepingBaseBlindBox", function () {

    describe("检查类", function () {
        it("应该拥有正确的合约最高权限", async function () {
            const {sleepingBaseBlindBox, owner} = await loadFixture(deploySleepingBaseBlindBoxNew);

            expect(
                await sleepingBaseBlindBox.owner()
            ).eq(owner.address);

        });

        it("应该拥有正确的sleepingBase合约地址", async function () {
            const {sleepingBaseBlindBox, sleepingBase} = await loadFixture(deploySleepingBaseBlindBoxNew);

            expect(
                await sleepingBaseBlindBox.sleepingBase()
            ).eq(sleepingBase.target);
        });

        it("应该拥有正确的开启和售卖时间", async function () {
            const {sleepingBaseBlindBox, sleepingBase} = await loadFixture(deploySleepingBaseBlindBoxNew);
            let openAndSalesTime = await sleepingBaseBlindBox.openAndSalesTime();
            let timeList = timeAnalysis(openAndSalesTime);
            expect(
                timeList[0].toString()
            ).not.eq("0");

            expect(
                timeList[1].toString()
            ).not.eq("0");
        });
    });

    describe("操作类", function () {
        describe("权限", function () {
            it("应该可以暂停开启合约,他人相反", async function () {
                const {sleepingBaseBlindBox, otherAccount} = await loadFixture(deploySleepingBaseBlindBoxNew);

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
                const {sleepingBaseBlindBox, otherAccount} = await loadFixture(deploySleepingBaseBlindBoxNew);

                await expect(
                    sleepingBaseBlindBox.connect(otherAccount).setOpenAndSalesTime(timeGeneration(["1688710482", "1688710482"]))
                ).to.be.reverted;
                await expect(
                    sleepingBaseBlindBox.setOpenAndSalesTime(timeGeneration(["1688710482", "1688710482"]))
                ).not.to.be.reverted
            });

            it("应该可以放弃权限和转移权限,他人相反", async function () {
                const {sleepingBaseBlindBox, owner, otherAccount} = await loadFixture(deploySleepingBaseBlindBoxNew);

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

            it("应该可以进行增发操作,他人相反", async function () {
                const {sleepingBaseBlindBox, owner, otherAccount} = await loadFixture(deploySleepingBaseBlindBoxNew);

                await expect(
                    sleepingBaseBlindBox.safeMint(owner.address, "123123123")
                ).not.to.be.reverted;
                await expect(
                    sleepingBaseBlindBox.connect(otherAccount).safeMint(owner.address, "123123123")
                ).to.be.reverted;

            });
        });

        describe("用户操作", function () {
            const generateMerkleData = readGenerateData('otherFiles/generateMerkle.json');

            it("应该可以进行正确的mint操作", async function () {
                const {
                    sleepingBaseBlindBox,
                    owner,
                    otherAccount,
                    sleepingBase
                } = await loadFixture(deploySleepingBaseBlindBoxNew);


                let payment = BigInt("0")
                let tokenIdList = ["123123123", "1231231213123"]
                let nonce = await sleepingBaseBlindBox.nonces();
                let deadline = times * 10

                let digest = await getUserMintDigest(
                    "SleepingBaseBlindBox",
                    sleepingBaseBlindBox.target.toString(),
                    {
                        address: owner.address.toString(),
                        paymentAmount: payment,
                        tokenIds: tokenIdList
                    },
                    nonce,
                    deadline
                )

                const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(PRIVATEKEY.slice(2), 'hex'))

                await expect(
                    sleepingBaseBlindBox.userMintPermit(
                        owner.address.toString(),
                        payment,
                        tokenIdList,
                        deadline,
                        v,
                        r,
                        s
                    )
                ).not.to.be.reverted;
            });

            it("未到时间应该不可以操作", async function () {
                const {
                    sleepingBaseBlindBox,
                    owner,
                    otherAccount,
                    sleepingBase
                } = await loadFixture(deploySleepingBaseBlindBoxNew);

                // 为盲盒合约增加mint权限
                let MINTER_ROLE = await sleepingBase.MINTER_ROLE()

                await sleepingBase.grantRole(MINTER_ROLE, sleepingBaseBlindBox.target)

                // 领取盲盒
                await sleepingBaseBlindBox.safeMint(owner.address, "123123123")
                // 领取盲盒
                await sleepingBaseBlindBox.safeMint(owner.address, "456456456")

                // 批准盲盒的转移
                await sleepingBaseBlindBox.setApprovalForAll(otherAccount.address, true);


                let valueData = BigInt("1");
                let tokenIdsData = ["12554203470773361529372990682287675750210981929426352078871"];
                let urisData = ["test"]
                let nonce = await sleepingBaseBlindBox.nonces();
                let deadline = times * 10

                let digest = await getOpenBoxDigest(
                    "SleepingBaseBlindBox",
                    sleepingBaseBlindBox.target.toString(),
                    {
                        amount: valueData,
                        address: owner.address.toString(),
                        tokenIds: tokenIdsData,
                        uris: urisData
                    },
                    nonce,
                    deadline
                )
                const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(PRIVATEKEY.slice(2), 'hex'))

                await expect(
                    sleepingBaseBlindBox.openBoxPermit(
                        valueData,
                        owner.address.toString(),
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
                } = await loadFixture(deploySleepingBaseBlindBoxNew);

                // 为盲盒合约增加mint权限
                let MINTER_ROLE = await sleepingBase.MINTER_ROLE()

                await sleepingBase.grantRole(MINTER_ROLE, sleepingBaseBlindBox.target)

                // 设置新的时间
                await time.increaseTo("0xa0789bb0");

                // 领取盲盒
                await sleepingBaseBlindBox.safeMint(owner.address, "123123123")
                // 领取盲盒
                await sleepingBaseBlindBox.safeMint(owner.address, "456456456")

                // 批准盲盒的转移
                await sleepingBaseBlindBox.setApprovalForAll(otherAccount.address, true);


                let valueData = BigInt("1");
                let tokenIdsData = ["12554203470773361529372990682287675750210981929426352078871"];
                let urisData = ["test"]
                let nonce = await sleepingBaseBlindBox.nonces();
                let deadline = times * 10

                let digest = await getOpenBoxDigest(
                    "SleepingBaseBlindBox",
                    sleepingBaseBlindBox.target.toString(),
                    {
                        amount: valueData,
                        address: owner.address.toString(),
                        tokenIds: tokenIdsData,
                        uris: urisData
                    },
                    nonce,
                    deadline
                )
                const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(PRIVATEKEY.slice(2), 'hex'))

                await expect(
                    sleepingBaseBlindBox.openBoxPermit(
                        valueData,
                        owner.address.toString(),
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

                let valueData = BigInt("1");
                let tokenIdsData = ["12554203470773361529372990682287675750210981929426352078871"];
                let urisData = ["test"]
                let nonce = await sleepingBaseBlindBox.nonces();
                let deadline = time * 10

                let digest = await getOpenBoxDigest(
                    "SleepingBaseBlindBox",
                    sleepingBaseBlindBox.target.toString(),
                    {
                        amount: valueData,
                        address: owner.address.toString(),
                        tokenIds: tokenIdsData,
                        uris: urisData
                    },
                    nonce,
                    deadline
                )
                const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(PRIVATEKEY.slice(2), 'hex'))

                await expect(
                    sleepingBaseBlindBox.openBoxPermit(
                        valueData + BigInt("1"),
                        owner.address.toString(),
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