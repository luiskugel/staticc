import pathLib from 'path'
import Snippet from './Snippet'
import Transpiler from '../Transpiler'
import { readFileFromDisk } from '../internal_lib'

enum PrefabType {
    JsPrefabSnippet,
    HtmlPrefabSnippet,
}

class PrefabSnippet extends Snippet {
    args: string[]
    fileContent: string
    type: PrefabType
    constructor(input_string: string, type: PrefabType, lineNumber: Number, path: string, transpiler: Transpiler) {
        super(input_string, lineNumber, path, transpiler)
        this.args = []
        this.fileContent = ''
        this.type = type
    }
    async resolve(_: any): Promise<void> {}
    async readFile() {
        let snippet_parts = this.input_string.split(' ').filter((value) => value != '')
        if (snippet_parts.length < 1) throw new Error('Not enough arguments! You need to at least give the filename!')
        //@ts-ignore
        this.filepath = pathLib.join(this.transpiler.baseFolder, 'prefabs', snippet_parts.shift(), this.type == PrefabType.JsPrefabSnippet ? 'prefab.js' : 'prefab.html')
        this.args = snippet_parts
        this.fileContent = await readFileFromDisk(this.filepath)
    }
}

export { PrefabSnippet, PrefabType }
