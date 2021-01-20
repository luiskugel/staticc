import Snippet from './Snippet'

class DataSnippet extends Snippet {
    constructor(input_string: string) {
        super(input_string)
    }
    async resolve(data: any): Promise<void> {
        let value = data
        const snippetParts = this.input_string.split('.')
        try {
            snippetParts.forEach((snippetPart) => {
                value = value[snippetPart]
                if (!value) throw new Error()
            })
        } catch (error) {
            throw Error('Could not resolve data-snippet. The requested value is undefined!')
        }
        this.result = value
        await this.postProcess(data)
    }
}

export default DataSnippet
