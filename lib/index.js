"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const chokidar_1 = __importDefault(require("chokidar"));
const child_process_1 = require("child_process");
const fs_extra_1 = __importDefault(require("fs-extra"));
const tar_fs_1 = __importDefault(require("tar-fs"));
const rimraf_1 = require("rimraf");
const cron_1 = require("cron");
const program = new commander_1.Command();
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
const app = (0, express_1.default)();
const PORT = process.env.ENV_PORT || 3000;
const DOWNLOAD_URL = process.env.ENV_FILE_URL || "https://swarmstoraccount.blob.core.windows.net/oslo-standards-register/dist.tar";
const TARGET_DIR = '../dist';
const FILENAME = 'dist.tar';
const TMP_DIR = '../tmp';
const watcher = chokidar_1.default.watch(TARGET_DIR);
watcher.on('ready', () => {
    watcher.on('all', () => {
        console.log(`[Chokidar]: clearing cache from server, due to new content`);
        Object.keys(require.cache).forEach((id) => {
            if (/[\/\\]app[\/\\]/.test(id))
                delete require.cache[id];
        });
    });
});
if (!DOWNLOAD_URL) {
    console.error('Please provide a URL to the updated content, so the server can fetch new updates');
    process.exit(1);
}
const fetchContent = (url, tmpDir) => {
    (0, child_process_1.exec)('wget ' + url + ' -P ' + tmpDir, (err) => {
        if (err) {
            console.log(`[Server]: an error occured while downloading ${url}.`);
            console.log(err);
            return;
        }
        else {
            console.log(`[Server]: done downloading.`);
            console.log(`[Server]: start extracting .tar folder to target directory: ${TARGET_DIR}`);
            fs_extra_1.default.createReadStream(tmpDir + '/' + FILENAME).pipe(tar_fs_1.default.extract(TARGET_DIR));
            console.log(`[Server]: removing tmp directory`);
            (0, rimraf_1.rimraf)(TMP_DIR).then(() => console.log(`[Server]: done removing tmp directory`));
        }
    });
};
fetchContent(DOWNLOAD_URL, TMP_DIR);
const job = new cron_1.CronJob('* * * * *', () => {
    fetchContent(DOWNLOAD_URL, TMP_DIR);
});
job.start();
app.use(express_1.default.static(path_1.default.join(__dirname, TARGET_DIR)));
console.log('Server running on port', PORT);
app.listen(PORT);
