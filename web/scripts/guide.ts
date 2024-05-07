import shell from 'shelljs';
import inquirer from 'inquirer';

const options = [
  {
    type: 'list',
    name: 'command',
    message: '请选择要执行的命令',
    choices: [
      {
        key: 1,
        name: '启动供应商端（supplier）',
        value: 'start:supplier',
      },
      {
        key: 2,
        name: '启动运营端（operator）',
        value: 'start:operator',
      },
      {
        key: 'home',
        name: '启动打开启动页',
        value: 'start:home',
      },
      {
        key: 3,
        name: '打包供应商端（supplier）',
        value: 'build:supplier',
      },
      {
        key: 4,
        name: '打包运营端（operator）',
        value: 'build:operator',
      },
      {
        key: 5,
        name: '全部打包',
        value: 'build',
      },
    ],
  },
];

function main() {
  inquirer.prompt(options).then((answers) => {
    shell.exec(`pnpm ${answers.command}`);
  });
}

main();
