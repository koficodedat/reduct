const { Command } = require('commander');

const program = new Command();

program
  .name('test-cli')
  .description('Test CLI')
  .version('0.1.0');

program
  .command('run')
  .description('Run a test')
  .argument('<type>', 'Type of test')
  .option('-s, --size <number>', 'Size of the test', '10000')
  .action((type, options) => {
    console.log('Type:', type);
    console.log('Options:', options);
  });

program.parse(process.argv);
