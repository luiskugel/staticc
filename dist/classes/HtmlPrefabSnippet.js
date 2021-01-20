Object.defineProperty(exports, "__esModule", { value: true });
const PrefabSnippet_1 = require("./PrefabSnippet");
class HtmlPrefabSnippet extends PrefabSnippet_1.PrefabSnippet {
    constructor(input_string) {
        super(input_string, PrefabSnippet_1.PrefabType.HtmlPrefabSnippet);
    }
    async resolve(data) {
        await super.readFile();
        this.result = this.fileContent;
        await this.postProcess(data);
    }
}
exports.default = HtmlPrefabSnippet;
