import {program} from 'commander';
import {execSync} from "child_process";

program
    .version('0.0.0')
    .requiredOption(
        '-i, --input <path>',
        '输入要展平的合约的名称'
    );

program.parse(process.argv);

console.log(`🩻 需要展平的合约的名称:${program.input}`);

try {
    const command = `npx hardhat flatten contracts/${program.input}  > contracts/flatten/${program.input}`;
    execSync(command, {encoding: 'utf8'});

    //console.log(output);
} catch (error) {
    console.error('Error executing command:', error);
}
console.log(`👌 合约已展平到:contracts/flatten/${program.input}`);
