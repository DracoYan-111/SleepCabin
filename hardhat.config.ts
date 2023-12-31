import "@nomicfoundation/hardhat-network-helpers";
import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "hardhat-abi-exporter";
import "hardhat-docgen";
import "xdeployer";

const config: HardhatUserConfig = {
    // 网络配置
    networks: {
        // hardhat 默认网络
        hardhat: {
            // 账户配置
            accounts: {
                mnemonic: "test test test test test test test test test test test junk",
                path: "m/44'/60'/0'/0",
                initialIndex: 0,
                count: 10
            },
            chainId: 10086
        },
        // 本地环境
        local: {
            url: "http://127.0.0.1:8545",
            // 链接时长
            timeout: 40000,
            // 账户配置
            accounts: {
                mnemonic: "test test test test test test test test test test test junk",
                path: "m/44'/60'/0'/0",
                initialIndex: 0,
                count: 10
            },
            chainId: 10086
        },
        bscMain: {
            url: "https://bsc-dataseed1.binance.org",
            accounts: [`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`]
        },
        bscTest: {
            url: "https://bsc-testnet.publicnode.com",
            accounts: [`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`]
        },
        mainnet: {
            url: "https://eth.llamarpc.com",
            accounts: [`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`]
        }
    },
    // 合约版本
    solidity: {
        // 多版本
        compilers: [
            {
                version: "0.8.19",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999
                    }
                }
            },
            {
                version: "0.8.8",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999
                    }
                }
            },
            {
                version: "0.8.9",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999
                    }
                }
            }
        ]
    },
    // gas记者
    gasReporter: {
        // 是否开启
        enabled: false,
        // 没有颜色
        noColors: true,
        // 显示运行时间
        showTimeSpent: true,
        // 法币
        currency: "USD",
        // 代币
        token: "ETH",
        // 动态的gasPrice
        gasPriceApi: "",
        // gas记者文件生成
        outputFile: "otherFiles/gas-report.txt",

    },
    // 合约大小
    contractSizer: {
        // 按字母顺序对结果排序
        alphaSort: false,
        // 编译后是否自动输出合约大小
        runOnCompile: false,
        // 超过大小限制是否抛出错误
        strict: true,
        // 输出合约大小
        outputFile: "otherFiles/contract-size-report.txt",
    },
    // abi导出
    abiExporter: {
        path: "otherFiles/abi/",
        runOnCompile: false,
        clear: true,

    },
    // 接口文档导出
    docgen: {
        path: "otherFiles/document/interfaceDoc",
        clear: true,
        runOnCompile: false
    },
    // 自动化开源
    etherscan: {
        apiKey: {
            mainnet: "",
        }
    },
    // 多链同地址部署
    xdeploy: {
        contract: "contracts/SleepingBaseBlindBoxFacelift.sol:SleepingBaseBlindBox",
        salt: "0xD7b084c89faDEB109AD5fADf16eFB6Be3F5a0bAc3a2A0b8e18Ce8Bff3Cd9a8",
        constructorArgsPath: "deploy/SleepingBaseBlindBoxConstructor.ts",
        signer: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        networks: [ "localhost"],
        rpcUrls: [ "http://127.0.0.1:8545/"],
        gasLimit: 11100000,
    }
};

export default config;
