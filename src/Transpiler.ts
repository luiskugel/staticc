import Preprocessor from './Preprocessing/Preprocessor'
import { seperate } from './seperate'
import { InterpretingMode, JsInterpreter } from './legacy/JsInterpreter'
import { replaceAll } from './internal_lib'

class Transpiler {
    input_string: string
    data: any
    path: string
    start_seperator: string
    end_seperator: string
    loadedFiles: string[]
    filesToCopy: { from: string; to: string }[]
    errorMsg: string
    plainHTMLSnippets: string[]
    resolvedSnippets: string[]
    interpreter: JsInterpreter
    argParams: any
    baseFolder: string
    constructor(
        input_string: string,
        data: any,
        path: string,
        interpretingMode: InterpretingMode,
        baseFolder: string = '',
        start_seperator: string = '{{',
        end_seperator: string = '}}',
        argParams: any = undefined
    ) {
        this.input_string = input_string
        this.data = data
        this.path = path
        this.start_seperator = start_seperator
        this.end_seperator = end_seperator
        this.loadedFiles = []
        this.filesToCopy = []
        this.errorMsg = ''
        this.plainHTMLSnippets = []
        this.resolvedSnippets = []
        this.interpreter = JsInterpreter.createInterpreter(interpretingMode)
        this.argParams = argParams
        this.baseFolder = baseFolder
    }
    async transpile(): Promise<string> {
        const preprocessor = new Preprocessor(this.input_string, this)
        try {
            this.input_string = preprocessor.preprocess(this.path)
        } catch (error) {
            if (error.message == 'link in src') {
                this.errorMsg += `\nError in ${this.path}\nYou can't use a file-link-snippet in a src file! All files in this folder are copied anyways if they are not inlined!\n`
            } else {
                this.errorMsg += `\nError in ${this.path}\nYou can only use one file-link-snippet in a file!\n`
            }
        }

        const { plainHTMLSnippets, codeSnippets } = seperate(this.input_string, this.start_seperator, this.end_seperator, this.path, this)
        this.plainHTMLSnippets = plainHTMLSnippets

        await Promise.all(
            codeSnippets.map(async (snippet) => {
                try {
                    await snippet.resolve(this.data)
                } catch (error) {
                    this.errorMsg += `\nError in Line ${snippet.lineNumber} in ${snippet.referencePath}\n${snippet.input_string}\n${error.message}\n`
                }
            })
        )
        this.resolvedSnippets = codeSnippets.map((snippet) => snippet.toString())

        this.recombine()
        return this.input_string
    }
    getErrorAsHtml() {
        this.errorMsg = replaceAll(this.errorMsg, '\n', '<br>')
        this.errorMsg = `${this.errorMsg}`
        return this.errorMsg
    }
    recombine() {
        let result = this.resolvedSnippets.reduce((total: string, currentValue: string, currentIndex: number) => {
            return total + this.plainHTMLSnippets[currentIndex] + currentValue
        }, '')
        result += this.plainHTMLSnippets[this.plainHTMLSnippets.length - 1]
        this.input_string = result
    }
    addLoadedFile(loadedFile: string) {
        this.loadedFiles.push(loadedFile)
    }
    addLinkedFile(from: string, to: string) {
        this.filesToCopy.push({
            from,
            to,
        })
    }
}

export default Transpiler
