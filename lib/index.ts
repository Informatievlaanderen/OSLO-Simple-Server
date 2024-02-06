import { Command } from 'commander';
import express, { Express } from 'express';
import path from 'path';
import chokidar from 'chokidar';
import { exec } from 'child_process';
import fs from 'fs-extra';
import tar from 'tar-fs';
import { rimraf } from 'rimraf'
import { CronJob } from 'cron';

const program = new Command();

// Enable this when testing server locally
program
    .version('2.0.0')
    .usage('serves the content in the dist folder, detects changes and automatically shows the new content')
    .option('-p, --path <path>', 'path where the updated dist folder should be fetched periodically');

program.on('--help', () => {
    console.log('');
    console.log('This program is created for the Open Standards for Linked Organizations team.');
    console.log("It is used to provide an easy way to show a static folder, for example the dist folder after an npm build");
    console.log("The program can be executed as follows:");
    console.log("node index.js -p <path>");
}); 

program.parse(process.argv);

const app: Express = express();

const PORT: string | number = process.env.ENV_PORT || 3000;
const DOWNLOAD_URL: string | null = process.env.ENV_FILE_URL || "https://swarmstoraccount.blob.core.windows.net/oslo-standards-register/dist.tar";
const TARGET_DIR: string = '../dist';
const FILENAME: string = 'dist.tar';
const TMP_DIR: string = '../tmp';

const watcher = chokidar.watch(TARGET_DIR);
watcher.on('ready', () => {
    watcher.on('all', () => {
        console.log(`[Chokidar]: clearing cache from server, due to new content`);
        Object.keys(require.cache).forEach((id: string) => {
            if (/[\/\\]app[\/\\]/.test(id)) delete require.cache[id]
        })
    })
});

if (!DOWNLOAD_URL) {
    console.error('Please provide a URL to the updated content, so the server can fetch new updates');
    process.exit(1);
}

const fetchContent = (url: string, tmpDir: string): void => {
    exec('wget ' + url + ' -P ' + tmpDir, (err: any) => {
        if (err) {
            console.log(`[Server]: an error occured while downloading ${url}.`);
            console.log(err);
            return;
        } else {
            console.log(`[Server]: done downloading.`);
            console.log(`[Server]: start extracting .tar folder to target directory: ${TARGET_DIR}`);
            fs.createReadStream(tmpDir + '/' + FILENAME).pipe(tar.extract(TARGET_DIR));

            console.log(`[Server]: removing tmp directory`);
            rimraf(TMP_DIR).then(() => console.log(`[Server]: done removing tmp directory`));
        }
    });
}

fetchContent(DOWNLOAD_URL, TMP_DIR);

const job = new CronJob('0 0 */1 * * *', () => {
    fetchContent(DOWNLOAD_URL, TMP_DIR);
});
job.start();


app.use(express.static(path.join(__dirname, TARGET_DIR)));
console.log('Server running on port', PORT);
app.listen(PORT);
