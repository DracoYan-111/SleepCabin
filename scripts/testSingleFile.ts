import {program} from 'commander';
import fs from 'fs';
import {parseBalanceMap} from '../src/parse-balance-map';
import {execSync} from "child_process";

program
    .version('0.0.0')
    .requiredOption('-i, --input <path>', '输入运行的脚本名称')
    .requiredOption('-n, --net <work>', '网络名称');

program.parse(process.argv);

console.log(`🩻 需要运行的脚本名称:${(program.input)}`);
try {
    const command = `npx hardhat test test/${program.input} --network ${program.net}`;
    let output = execSync(command, {encoding: 'utf8'});

    console.log(output);
} catch (error) {
    console.error('Error executing command:', error);
}
console.log(`👌 运行完成`);
