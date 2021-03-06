var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBuildableFiles = exports.FileManager = exports.InterpretingMode = exports.build = exports.minifyHTML = exports.Transpiler = void 0;
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
const Transpiler_1 = __importDefault(require("./Transpiler"));
exports.Transpiler = Transpiler_1.default;
const html_minifier_1 = require("html-minifier");
const FileManager_1 = require("./FileManager");
Object.defineProperty(exports, "FileManager", { enumerable: true, get: function () { return FileManager_1.FileManager; } });
const JsInterpreter_1 = require("./legacy/JsInterpreter");
Object.defineProperty(exports, "InterpretingMode", { enumerable: true, get: function () { return JsInterpreter_1.InterpretingMode; } });
const Timer_1 = require("./Timer");
const internal_lib_1 = require("./internal_lib");
function minifyHTML(html_String) {
    return html_minifier_1.minify(html_String, {
        removeComments: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
    });
}
exports.minifyHTML = minifyHTML;
function getAllBuildableFiles(globPath) {
    return glob_1.glob.sync(`${globPath}/**/*.html`);
}
exports.getAllBuildableFiles = getAllBuildableFiles;
async function build(data, options = defaultBuildOptions) {
    const buildOptions = { ...defaultBuildOptions, ...options };
    const buildableFiles = getAllBuildableFiles(buildOptions.sourceFolder);
    const fileManager = new FileManager_1.FileManager();
    fileManager.ignoreFiles(buildableFiles);
    if (buildOptions.filesToBuild.length === 0)
        buildOptions.filesToBuild = buildableFiles;
    console.info('\nstarting build!');
    await Promise.all(buildOptions.filesToBuild.map(async (file) => {
        console.info(file);
        const timer = new Timer_1.Timer(`Finished ${file} after`);
        await transpileFile(file, data, fileManager, buildOptions);
        timer.print();
    }));
    fileManager.execute();
}
exports.build = build;
async function transpileFile(file, data, fileManager, buildOptions) {
    console.info('Building: ' + file);
    const successful = await generateNewFile(file, await changeFilenameFromSrcToDist(file, buildOptions.sourceFolder, buildOptions.buildFolder, async (name) => {
        const transpiler = new Transpiler_1.default(name, data, file, buildOptions.interpretingMode, buildOptions.baseFolder);
        let transpiledName = await transpiler.transpile();
        if (transpiler.errorMsg !== '') {
            console.error(transpiler.errorMsg);
            return name;
        }
        return transpiledName;
    }), async (content, build_prod) => {
        const transpiler = new Transpiler_1.default(content, data, file, buildOptions.interpretingMode, buildOptions.baseFolder);
        let transpiledCode = await transpiler.transpile();
        if (transpiler.errorMsg !== '') {
            console.error(transpiler.errorMsg);
            transpiledCode = transpiler.getErrorAsHtml();
        }
        fileManager.copyFiles(transpiler.filesToCopy);
        fileManager.ignoreFiles(transpiler.loadedFiles);
        if (build_prod)
            transpiledCode = minifyHTML(transpiledCode);
        return transpiledCode;
    }, buildOptions.productive);
    if (!successful) {
        console.error(file + ' could not be transpiled!');
    }
}
async function generateNewFile(readFileName, writeFileName, fn, ...args) {
    const readFileContent = await internal_lib_1.readFileFromDisk(readFileName);
    let writeFileContent;
    //file read correctly
    writeFileContent = await fn(readFileContent, ...args);
    await internal_lib_1.saveFileToDisk(writeFileName, writeFileContent);
    return true;
}
const defaultBuildOptions = {
    productive: true,
    interpretingMode: JsInterpreter_1.InterpretingMode.experimental,
    filesToBuild: [],
    sourceFolder: 'src',
    buildFolder: 'dist',
    baseFolder: '',
};
async function changeFilenameFromSrcToDist(file, sourceFolder, buildFolder, nameResolverFn = async (basename) => basename) {
    const fileEnding = path_1.default.extname(file);
    const basename = path_1.default.basename(file, fileEnding);
    const dirname = path_1.default.dirname(file);
    const newDirname = dirname.replace(sourceFolder, buildFolder);
    const newBasename = await nameResolverFn(basename);
    return path_1.default.join(newDirname, newBasename + fileEnding);
}
