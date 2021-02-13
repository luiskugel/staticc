import fs from 'fs'
import pathLib from 'path'
import { glob } from 'glob'
import sass from 'node-sass'

interface FileCopyObject {
    from: string
    to: string
}

export class FileManager {
    filesToIgnore: string[]
    filesToCopy: FileCopyObject[]
    constructor() {
        this.filesToIgnore = []
        this.filesToCopy = []
    }
    copyFiles(files: FileCopyObject[]) {
        this.filesToCopy = [...this.filesToCopy, ...files]
    }
    ignoreFiles(files: string[]) {
        this.filesToIgnore = [...this.filesToIgnore, ...files]
    }

    execute() {
        copyAllFiles(this.filesToIgnore)
        copyLinkedFiles(this.filesToCopy)
    }
}

function copyAllFiles(filter: string[]) {
    const allfiles = glob.sync('src/**/*.*')
    allfiles.forEach((file) => {
        if (filter.includes(file)) return
        const newFilepath = changeFilenameFromSrcToDist(file)
        const folderpath = newFilepath
            .split('/')
            .splice(0, newFilepath.split('/').length - 1)
            .join('/')
        if (folderpath) fs.mkdirSync(folderpath, { recursive: true })
        fs.copyFileSync(file, newFilepath)
    })
}

async function copyLinkedFiles(files: { from: string; to: string }[]) {
    await Promise.all(
        files.map(async (file) => {
            fs.mkdirSync(pathLib.dirname(file.to), { recursive: true })
            if (pathLib.extname(file.from) === '.sass' || pathLib.extname(file.from) === '.scss') {
                await copyAndResolveSass(file.from, file.to)
            } else {
                await fs.promises.copyFile(file.from, file.to)
            }
        })
    )
}

async function copyAndResolveSass(from: string, to: string) {
    const filecontent = await fs.promises.readFile(from, { encoding: 'utf-8' })
    try {
        const renderedSass = sass.renderSync({ data: filecontent }).css.toString()
        await fs.promises.writeFile(to.replace('.sass', '.css').replace('.scss', '.css'), renderedSass, { encoding: 'utf-8' })
    } catch (error) {
        console.error(`Rendering linked sass-file: ${from} exited with ${error.message}`)
    }
}

export function changeFilenameFromSrcToDist(file: string) {
    return 'dist' + file.substring(3)
}
