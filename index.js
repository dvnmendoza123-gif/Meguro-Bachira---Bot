import { join, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import cluster from 'cluster';
import { watchFile, unwatchFile } from 'fs';
import cfonts from 'cfonts';
import { createInterface } from 'readline';
import yargs from 'yargs';
import chalk from 'chalk';

console.log(chalk.magenta('\n✰ Iniciando Meguro-Bachira Bot ✰'));

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);
const { name, description, author, version } = require(join(__dirname, './package.json'));
const { say } = cfonts;
const rl = createInterface(process.stdin, process.stdout);

// Estilos visuales
say('Meguro-Bachira', {
    font: 'block',
    align: 'center',
    colors: ['cyanBright']
});

say(`Multi Device`, {
    font: 'chrome',
    align: 'center',
    colors: ['yellowBright']
});

say(`Developed By • Dvnmendoza`, {
    font: 'console',
    align: 'center',
    colors: ['greenBright']
});

// Estado del bot
let isRunning = false;

// Función principal
function start(file) {
    if (isRunning) return;
    isRunning = true;

    const scriptPath = join(__dirname, file);
    const args = [scriptPath, ...process.argv.slice(2)];

    say(`Iniciando: ${args.join(' ')}`, {
        font: 'console',
        align: 'center',
        colors: ['candy']
    });

    if (cluster.isPrimary) {
        let worker = cluster.fork();

        worker.on('message', data => {
            switch (data) {
                case 'reset':
                    console.log(chalk.yellow('♻ Reiniciando bot...'));
                    worker.kill();
                    isRunning = false;
                    start(file);
                    break;

                case 'uptime':
                    worker.send(process.uptime());
                    break;
            }
        });

        worker.on('exit', code => {
            console.log(chalk.red(`❌ El proceso se cerró con código: ${code}`));

            // Si el cierre fue inesperado, intenta revivirlo
            if (!isRunning) return;
            console.log(chalk.blue('Intentando reiniciar automáticamente...'));

            watchFile(scriptPath, () => {
                unwatchFile(scriptPath);
                start(file);
            });
        });

        let opts = new Object(
            yargs(process.argv.slice(2)).exitProcess(false).parse()
        );

        // Solo inicia readline si no está en modo test
        if (!opts['test'] && !rl.listenerCount('line')) {
            rl.on('line', line => {
                worker.send(line.trim());
            });
        }
    }
}

// Manejo de warnings
process.on('warning', warning => {
    if (warning.name === 'MaxListenersExceededWarning') {
        console.warn('⚠ Se excedió el límite de Listeners:');
        console.warn(warning.stack);
    }
});

// Iniciar bot
start('starcore.js');