import {ethers} from "hardhat";

async function main() {
    // 给其他用户转账
    const amountEther = 100; // 转账金额（以太）
    const [owner, otherAccount] = await ethers.getSigners();
    let tx = await owner.sendTransaction({
        to: "0x5ab8C46e98D6f86496C0b415110ABB0Cd734F6Af",
        value: ethers.parseEther(amountEther.toString()) // 转换为 Wei
    })
    console.log('Transaction hash:', tx.hash);
    await tx.wait(); // 等待交易完成
    console.log('Transaction confirmed in block:', tx.blockNumber);
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
