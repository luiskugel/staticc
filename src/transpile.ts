import { preprocess } from './preprocess'
import { recombine } from './recombine'
import { resolve } from './resolve'
import { seperate } from './seperate'

export const _transpile = async (staticcString: string, data: any, snippetPrefix: string = '', path: string = 'src/', start_seperator: string = '{{', end_seperator: string = '}}') => {
    staticcString = preprocess(staticcString)

    //SEPERATOR ENGINE
    const [plainHTMLSnippets, codeSnippets] = seperate(staticcString, start_seperator, end_seperator)

    //RESOLVER ENGINE
    const { resolvedSnippets, loadedFiles } = await resolve(codeSnippets, data, path)

    //RECOMBINATOR ENGINE
    const htmlString = recombine(plainHTMLSnippets, resolvedSnippets)
    return { htmlString, loadedFiles }
}
