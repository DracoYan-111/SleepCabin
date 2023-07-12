import { program } from 'commander';
import fs from 'fs';
import { parseBalanceMap } from '../src/parse-balance-map';

program
    .version('0.0.0')
    .requiredOption(
        '-i, --input <path>',
        '输入 JSON 文件位置，其中包含账户地址到字符串余额的映射'
    );

program.parse(process.argv);

const json = JSON.parse(fs.readFileSync(program.input, { encoding: 'utf8' }));

if (typeof json !== 'object') throw new Error('无效的 JSON');

const parsedResult = parseBalanceMap(json);
const outputFile = 'otherFiles/generateMerkle.json';

fs.writeFileSync(outputFile, JSON.stringify(parsedResult, null, 2));

console.log(`解析后的数据已保存到 ${outputFile}`);