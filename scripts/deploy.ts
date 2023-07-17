import {
    getApprovalDigest,
    getDomainSeparator,
    PERMIT_TYPEHASH,
    timeGeneration
} from "../utils/utils"
import {ecsign} from 'ethereumjs-util'

async function main() {
    //runGenerateMerkleRoot();
    console.log(PERMIT_TYPEHASH)
    console.log(getDomainSeparator("SleepingBaseBlindBox", "0x9D7f74d0C41E726EC95884E0e97Fa6129e3b5E99"))
    // console.log(tokenIdGeneration(["2", "5", "16", "25", "23", "67"]));
    console.log(timeGeneration(["1688975325", "1688975325"]));

    const digest = await getApprovalDigest(
        "SleepingBaseBlindBox",
        "0x9a2E12340354d2532b4247da3704D2A5d73Bd189",
        {
            value: 1,
            tokenIds: ["12554203470773361529372990682287675750210981929426352078871"],
            uris: ["test"]
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
