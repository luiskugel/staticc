import JsInterpreter from 'js-interpreter'
import { workerData, parentPort } from 'worker_threads'

const { snippet, data } = workerData

const preparationCode = 'var data = JSON.parse(_data);'
//babel transpilation
const code = preparationCode + snippet.value
const interpreter = new JsInterpreter(code, jsInterpretInitFn)
interpreter.setProperty(interpreter.globalObject, '_data', JSON.stringify(data))
interpreter.run()
snippet.value = interpreter.value
parentPort?.postMessage(snippet)

export function jsInterpretInitFn(interpreter: any, globalObject: any): void {
    const _render = (content: any) => {
        globalObject.renderedContent = content
    }
    const log = (something: any) => {
        console.log(something)
    }
    interpreter.setProperty(globalObject, '_render', interpreter.createNativeFunction(_render))
    interpreter.setProperty(globalObject, 'log', interpreter.createNativeFunction(log))
}