import {ethers} from "hardhat";
import {
    getApprovalDigest,
    getDomainSeparator,
    PERMIT_TYPEHASH,
    runGenerateMerkleRoot,
    tokenIdGeneration,
    timeGeneration
} from "../utils/utils"
import {ecsign} from 'ethereumjs-util'

async function main() {
    // // 创建以太坊签名对象
    // const signingKey = new ethers.utils.SigningKey('0xbd1d2b53a2fafe949523b2a3bc70b82bf6005a62c29a70de81acaaf08abe3d0f');     // 对消息哈希进行签名
    // const signature = signingKey.signDigest("0xf1d751c64b16a54b6624b1d996d3c652266cfe6b38cf6c61b0ea13c979a6243e");
    // // 从签名中提取 r, s, v 值
    // const {
    //     r,
    //     s,
    //     v
    // } = ethers.utils.splitSignature("0xf8b3d58c564f81f021d752c2ab23d817f74cba02a93f973589def65dc477196a740ff3f424fc7d0cabbe55030e894e3ae3c0998c1b811d7464b1d1af9a2ebc761b");
    // console.log('v:', v);
    // console.log('r:', r);
    // console.log('s:', s);

    // const permitTypeHash = ''; // 你需要替换为正确的 typehash
    // const nonce = 0
    // const message = {
    //     owner: "0x001d1dC40383a700aC94B364EA82d0AecBe51127",
    //     spender: "0xDDC22a2e784dbe167FAa17a63F4dB4B0b81252Ed",
    //     value: 10000000000,
    //     deadline: 1688364775,
    //     nonce: 0,
    // };
    // const domain = {
    //     name: 'MyToken',
    //     version: '1',
    //     chainId: 80001, // 你需要替换为正确的链ID
    //     verifyingContract: '0x62e015e500cf58c870dC27483357A878FFbC7BfF', // 你需要替换为正确的合约地址
    // };
    // const types = {
    //     Permit: [
    //         {name: 'owner', type: 'address'},
    //         {name: 'spender', type: 'address'},
    //         {name: 'value', type: 'uint256'},
    //         {name: 'deadline', type: 'uint256'},
    //         {name: 'nonce', type: 'uint256'},
    //     ],
    // };
    // const provider = ethers.getDefaultProvider("https://rpc.ankr.com/polygon_mumbai");
    //
    // const signer = new ethers.Wallet("", provider);
    // const signature = await signer._signTypedData(domain, types, message);
    // const {v, r, s} = ethers.utils.splitSignature(signature);
    // console.log(v, r, s)

    //runGenerateMerkleRoot();
    console.log(PERMIT_TYPEHASH)
    console.log(getDomainSeparator("SleepingBaseBlindBox", "0x9D7f74d0C41E726EC95884E0e97Fa6129e3b5E99"))
    // console.log(tokenIdGeneration(["2", "5", "16", "25", "23", "67"]));
    console.log(timeGeneration(["1688975325", "1688975325"]));

    const digest = await getApprovalDigest(
        "SleepingBaseBlindBox",
        "0x5FD6eB55D12E759a21C09eF703fe0CBa1DC9d88D",
        {
            value: 1,
            tokenIds: ["12554203470773361529372990682287675750210981929426352078871"],
            uris: ["test"]
        },
        2,
        1698984438
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
