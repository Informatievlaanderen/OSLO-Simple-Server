import express, { Express } from 'express';
import path from 'path';
import chokidar from 'chokidar';
import { exec } from 'child_process';
import fs from 'fs-extra';
import tar from 'tar-fs';
import { rimraf } from 'rimraf'
import { CronJob } from 'cron';
import dotenv from 'dotenv';

// initialize .env configuration
dotenv.config();

const app: Express = express();

const PORT: string | number = process.env.PORT || 3000;
const TARGET_DIR: string = path.join(__dirname, process.env.TARGET_DIR || 'dist');
const TMP_DIR: string = path.join(__dirname, process.env.TMP_DIR || 'tmp');
const DOWNLOAD_URL: string | null = process.env.FILE_URL || "";
const FILENAME: string = process.env.FILENAME || 'dist.tar';

console.log(`[Server]: target directory: ${TARGET_DIR}`);
console.log(`[Server]: tmp directory: ${TMP_DIR}`);
console.log(`[Server]: download url: ${DOWNLOAD_URL}`);
console.log(`[Server]: filename: ${FILENAME}`);

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

const createTmpDir = (dir: string): void => {
    exec(`mkdir -p ${dir}`, (err: unknown) => {
        if (err) {
            console.log(`[Server]: an error occured while creating ${dir} directory.`);
            console.log(err);
            return;
        }
    });
}

const fetchContent = (url: string, tmpDir: string): void => {
    // Create the tmpDir directory if it doesn't exist
    createTmpDir(tmpDir);
    exec(`mkdir -p ${tmpDir}`, (err: unknown) => {
        if (err) {
            console.log(`[Server]: an error occured while creating ${tmpDir} directory.`);
            console.log(err);
            return;
        }
    });
    exec(`wget ${url} -P ${tmpDir}`, (err: unknown) => {
        if (err) {
            console.log(`[Server]: an error occured while downloading ${url}.`);
            console.log(err);
            return;
        } else {
            console.log(`[Server]: done downloading.`);
            console.log(`[Server]: start extracting .tar folder to target directory: ${TARGET_DIR}`);
            fs.createReadStream(`${tmpDir}/${FILENAME}`).pipe(tar.extract(TARGET_DIR));

            console.log(`[Server]: removing ${TMP_DIR} directory`);
            rimraf(TMP_DIR).then(() => console.log(`[Server]: done removing ${TMP_DIR} directory`));
        }
    });
}

fetchContent(DOWNLOAD_URL, TMP_DIR);

const job = new CronJob('0 0 */1 * * *', () => {
    fetchContent(DOWNLOAD_URL, TMP_DIR);
});
job.start();

app.use(express.static(TARGET_DIR));
console.log('Server running on port', PORT);
app.listen(PORT);
