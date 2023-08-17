import {
    getOpenBoxDigest,
    getUserMintDigest,
    PRIVATEKEY
} from "../utils/utils"
import {ecsign} from 'ethereumjs-util'

async function main() {
    // mint 盲盒NFT
    const digest = await getUserMintDigest(
        "SleepingBaseBlindBox",
        "合约地址",
        {
            address: "用户地址",
            paymentAmount: BigInt("盲盒单价"),
            tokenIds: ["nftID"],
        },
        1,// await sleepingBaseBlindBox.nonces()方法获取
        1692253765 //当前时间戳+6分钟
    )
    console.log(digest)
    const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(PRIVATEKEY.slice(2), 'hex'))
    console.log(v)
    console.log("0x" + r.toString("hex"))
    console.log("0x" + s.toString("hex"))

    //==================== 我是分割线 ========================

    // open盲盒NFT
    const digestTwo = await getOpenBoxDigest(
        "SleepingBaseBlindBox",
        "合约地址",
        {
            amount: BigInt("打开数量"),
            address: "用户地址",
            tokenIds: ["新的nftId数组"],
            uris: ["新的nftId数组"]
        },
        1,// await sleepingBaseBlindBox.nonces()方法获取
        1692253765 //当前时间戳+6分钟
    )
    console.log(digestTwo)
    const {vTwo, rTwo, sTwo} = ecsign(Buffer.from(digestTwo.slice(2), 'hex'), Buffer.from(PRIVATEKEY.slice(2), 'hex'))
    console.log(vTwo)
    console.log("0x" + rTwo.toString("hex"))
    console.log("0x" + sTwo.toString("hex"))


}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
