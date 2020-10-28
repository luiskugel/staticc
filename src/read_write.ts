import * as fs from 'fs'
import * as pathLib from 'path'
import { trycatchasync } from './trycatch'

export const readFileFromDisk = async (filepath: string): Promise<string> => {
    //read file from disk
    const [readFileError, content] = await trycatchasync(fs.promises.readFile, filepath, { encoding: 'utf8' })
    if (readFileError) throw new Error('Could not read file: ' + filepath)
    return content
}

export const saveFileToDisk = async (filepath: string, content: string): Promise<void> => {
    //save file to disk (+ create folders if neccesary)
    const folderpath: string = pathLib.join(...filepath.split('/').splice(0, filepath.split('/').length - 1))

    if (folderpath) {
        const [mkdirError] = await trycatchasync(fs.promises.mkdir, folderpath, { recursive: true })
        if (mkdirError) throw new Error('Could not create a new folder: ' + folderpath)
    }
    const [writeFileError] = await trycatchasync(fs.promises.writeFile, filepath, content)
    if (writeFileError) throw new Error('Could not write to file: ' + filepath)
}