import { replaceAll } from './lib'
import Preprocessor from './Preprocessor'
import { seperate } from './seperate'

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
    constructor(input_string: string, data: any, path: string, start_seperator: string = '{{', end_seperator: string = '}}') {
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
    }
    async transpile(): Promise<string> {
        const preprocessor = new Preprocessor(this.input_string)
        this.input_string = preprocessor.preprocess(this.path)

        const { plainHTMLSnippets, codeSnippets } = seperate(this.input_string, this.start_seperator, this.end_seperator, this.path)
        this.plainHTMLSnippets = plainHTMLSnippets

        await Promise.all(
            codeSnippets.map(async (snippet) => {
                try {
                    await snippet.resolve(this.data)
                } catch (error) {
                    this.errorMsg = `Error in Line ${snippet.lineNumber} in ${snippet.referencePath}\n${snippet.input_string}\n${error.message}\n`
                }
            })
        )

        const loadedFiles = codeSnippets.map((snippet) => snippet.getLoadedFiles()).flat()
        const filesToCopyFromSnippets = codeSnippets.map((snippet) => snippet.filesToCopy).flat()
        this.filesToCopy = [...this.filesToCopy, ...preprocessor.linkedFiles, ...filesToCopyFromSnippets]
        this.loadedFiles = [...this.loadedFiles, ...preprocessor.loadedFiles, ...loadedFiles]
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
}

export default Transpiler