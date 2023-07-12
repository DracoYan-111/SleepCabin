import {program} from 'commander';
import fs from 'fs';
import {parseBalanceMap} from '../src/parse-balance-map';
import {execSync} from "child_process";

program
    .version('0.0.0')
    .requiredOption(
        '-i, --input <path>',
        '输入待编译的合约名称'
    );

program.parse(process.argv);

console.log(`🩻 需要编译的合约名称:${(program.input).slice(0, -4)}`);
try {
    const command = `solcjs contracts/flatten/${program.input} --optimize-runs 999999999 --bin --abi -o otherFiles/compileFile/${(program.input).slice(0, -4)}`;
    execSync(command, {encoding: 'utf8'});

    //console.log(output);
} catch (error) {
    console.error('Error executing command:', error);
}
console.log(`👌 合约已编译到:otherFiles/compileFile/${(program.input).slice(0, -4)}`);
