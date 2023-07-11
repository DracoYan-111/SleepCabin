import {ecsign} from 'ethereumjs-util'
import {utils} from "ethers";

const chainId = 1;
const contractName = "SleepingBaseBlindBox"
const contractAddress = "0x9a2E12340354d2532b4247da3704D2A5d73Bd189"
const PERMIT_TYPEHASH = utils.keccak256(
    utils.toUtf8Bytes(
        'openBoxPermit(uint256 amount, uint256[] calldata tokenIds, string[] calldata uris, uint256 nonce, uint deadline)'
    )
)

function getDomainSeparator() {
    return utils.keccak256(
        utils.defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [
                utils.keccak256(
                    utils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
                ),
                utils.keccak256(utils.toUtf8Bytes(contractName)),
                utils.keccak256(utils.toUtf8Bytes('1')),
                chainId,
                contractAddress,
            ]
        )
    )
}

async function getApprovalDigest(
    permit: { uris: string[]; tokenIds: string[]; value: number },
    nonce: number
): Promise<string> {
    const DOMAIN_SEPARATOR = getDomainSeparator()
    let deadline = "1789067245"//(Math.floor(Date.now() / 1000)) + 300
    console.log(deadline)
    return utils.keccak256(
        utils.solidityPack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
                '0x19',
                '0x01',
                DOMAIN_SEPARATOR,
                utils.keccak256(
                    utils.defaultAbiCoder.encode(
                        ['bytes32', 'uint256', 'uint256[]', 'string[]', 'uint256', 'uint256'],
                        [
                            PERMIT_TYPEHASH,
                            permit.value,
                            permit.tokenIds,
                            permit.uris,
                            nonce,
                            deadline
                        ])),
            ]
        )
    )
}

async function main() {
    console.log(PERMIT_TYPEHASH)

    console.log(getDomainSeparator());

    const digest = await getApprovalDigest(
        {
            value: 1,
            tokenIds: ["12554203470773361529372990682287675750210981929426352078871"],
            uris: ["test"]
        },
        0,
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
