import {
    getApprovalDigest,
    getDomainSeparator, getOpenBoxDigest, getUserMintDigest,
    PERMIT_TYPEHASH, PERMIT_TYPEHASH_TWO,
    timeGeneration
} from "../utils/utils"
import {ecsign} from 'ethereumjs-util'
import {ethers} from "hardhat";

async function main() {
    // const amountEther = 100; // 转账金额（以太）
    // const [owner, otherAccount] = await ethers.getSigners();
    // let tx = await owner.sendTransaction({
    //     to: "0x5ab8C46e98D6f86496C0b415110ABB0Cd734F6Af",
    //     value: ethers.parseEther(amountEther.toString()) // 转换为 Wei
    // })
    // console.log('Transaction hash:', tx.hash);
    // await tx.wait(); // 等待交易完成
    // console.log('Transaction confirmed in block:', tx.blockNumber);


    //runGenerateMerkleRoot();
    console.log(PERMIT_TYPEHASH_TWO)
    console.log(getDomainSeparator("SleepingBaseBlindBox", "0x9D7f74d0C41E726EC95884E0e97Fa6129e3b5E99"))
    // console.log(tokenIdGeneration(["2", "5", "16", "25", "23", "67"]));
    let paymentAmountIsFreeMint = timeGeneration(["1688975325", "1688975325"])
    console.log(paymentAmountIsFreeMint);


    const digest = await getUserMintDigest(
        "SleepingBaseBlindBox",
        "0x9a2E12340354d2532b4247da3704D2A5d73Bd189",
        {
            packed: paymentAmountIsFreeMint,
            tokenIds: ["12554203470773361529372990682287675750210981929426352078871"]
        },
        0,
        1789067245
    )
    console.log(digest)
    let privateKey = "0xbd1d2b53a2fafe949523b2a3bc70b82bf6005a62c29a70de81acaaf08abe3d0f";
    const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKey.slice(2), 'hex'))
    console.log(v)
    console.log("0x" + r.toString("hex"))
    console.log("0x" + s.toString("hex"))
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
