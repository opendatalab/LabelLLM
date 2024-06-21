const shell = require('shelljs');
const inquirer = require('inquirer');

const options = [
  {
    type: 'list',
    name: 'command',
    message: '请选择要执行的命令',
    choices: [
      {
        key: 0,
        name: '启动登录页（login）',
        value: 'start:login',
      },
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
