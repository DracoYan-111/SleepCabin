import {defaultAbiCoder} from "@ethersproject/abi";
import {pack} from "@ethersproject/solidity";
import * as ethersUtils from 'ethers';
import {ecsign} from 'ethereumjs-util'
import {program} from "commander";
import fs from "fs";
import {execSync} from "child_process";

const PERMIT_TYPEHASH = ethersUtils.keccak256(
    ethersUtils.toUtf8Bytes('openBoxPermit(uint256 amount, uint256[] calldata tokenIds, string[] calldata uris, uint256 nonce, uint deadline)')
)

function getDomainSeparator() {
    return ethersUtils.keccak256(
        defaultAbiCoder.encode(
            ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
            [
                ethersUtils.keccak256(
                    ethersUtils.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
                ),
                ethersUtils.keccak256(ethersUtils.toUtf8Bytes("SleepingBaseBlindBox")),
                ethersUtils.keccak256(ethersUtils.toUtf8Bytes('1')),
                10086,
                "0x9a2E12340354d2532b4247da3704D2A5d73Bd189",
            ]
        )
    )
}


async function getApprovalDigest(
    permit: { uris: string[]; tokenIds: string[]; value: number },
    nonce: number,
    deadline: number
): Promise<string> {
    const DOMAIN_SEPARATOR = getDomainSeparator()
    return ethersUtils.keccak256(
        pack(
            ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
            [
                '0x19',
                '0x01',
                DOMAIN_SEPARATOR,
                ethersUtils.keccak256(
                    defaultAbiCoder.encode(
                        ['bytes32', 'uint256', 'uint256[]', 'string[]', 'uint256', 'uint256'],
                        [
                            PERMIT_TYPEHASH,
                            permit.value,
                            permit.tokenIds,
                            permit.uris,
                            nonce,
                            deadline
                        ]
                    )
                ),
            ]
        )
    )
}

program
    .version('0.0.0')
    .requiredOption(
        '-u, --uris <uris>',
        '输入 JSON 文件位置，其中包含账户地址到字符串余额的映射',
        value => value.split(','))
    .requiredOption(
        '-t, --tokenIds <tokenIds>',
        '输入 JSON 文件位置，其中包含账户地址到字符串余额的映射',
        value => value.split(','))
    .requiredOption(
        '-v, --value <value>',
        '输入 JSON 文件位置，其中包含账户地址到字符串余额的映射');

program.parse(process.argv);


try {
    let s = getApprovalDigest(
        {
            tokenIds: program.tokenIds,
            uris: program.uris,
            value: program.value
        },
        0,
        1789067245,);

    s.then(value => {
        console.log(value)
        let privateKey = "0xbd1d2b53a2fafe949523b2a3bc70b82bf6005a62c29a70de81acaaf08abe3d0f";
        const {v, r, s} = ecsign(Buffer.from(value.slice(2), 'hex'), Buffer.from(privateKey.slice(2), 'hex'))
        console.log(v)
        console.log("0x" + r.toString("hex"))
        console.log("0x" + s.toString("hex"))
    })

} catch
    (error) {
    console.error('Error executing command:', error);
}


