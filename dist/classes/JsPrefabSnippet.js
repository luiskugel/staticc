var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PrefabSnippet_1 = require("./PrefabSnippet");
const Preprocessor_1 = __importDefault(require("../Preprocessor"));
//@ts-ignore
let modulePath = require.main.path;
modulePath = modulePath.replace('__tests__', 'dist');
class JsPrefabSnippet extends PrefabSnippet_1.PrefabSnippet {
    constructor(input_string, lineNumber, path, transpiler) {
        super(input_string, PrefabSnippet_1.PrefabType.JsPrefabSnippet, lineNumber, path, transpiler);
    }
    async resolve(data) {
        await super.readFile();
        const preprocessor = new Preprocessor_1.default(this.fileContent);
        preprocessor.path = this.filepaths[0];
        preprocessor.extractLinkedFiles();
        this.fileContent = preprocessor.input_string;
        this.filesToCopy = [...this.filesToCopy, ...preprocessor.linkedFiles];
        try {
            const result = await this.interpret(data);
            this.result = result;
        }
        catch (error) {
            throw new Error(`JS-Interpreter exited with ${error}`);
        }
        await this.postProcess(data);
    }
    async interpret(data) {
        return this.transpiler.interpreter.interpret(this.fileContent, data, this.args);
    }
}
exports.default = JsPrefabSnippet;
