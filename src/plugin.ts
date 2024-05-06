import buffer from 'node:buffer'
import type { PluginOption } from 'vite'
import ts from 'typescript'
import { analyzeNode, extractImports } from './ast'
import type { AnalyzedOptions, ImportedObject, JsrpcPluginOptions, UseServerFunction } from './type'

function virtualSourceFile(id: string, code: string) {
  return ts.createSourceFile(
    id,
    code,
    ts.ScriptTarget.ESNext,
    true,
  )
}

function analyzeOption(): AnalyzedOptions {
  const importsMap: Record<string, ImportedObject> = {}
  const functions: UseServerFunction[] = []
  return {
    importsMap,
    functions,
  }
}

export const JsrpcPlugin: (option: JsrpcPluginOptions) => PluginOption = (option: JsrpcPluginOptions) => {
  return ({
    name: 'viembed',
    async transform(code, id) {
      if (option.filter) {
        if (!option.filter(id))
          return code
      }
      /**
       * 判断是否为 tsx、vue 文件，需要考虑后续可能会存在 ?t=xxx 的情况
       */
      else if (!/\.(tsx|vue)/.test(id)) {
        return code
      }
      /**
       * 去除 id 中的 ? 后面的内容
       */
      id = id.split('?')[0]
      const file = virtualSourceFile(id, code)
      const analyzedOptions = analyzeOption()
      extractImports(file, analyzedOptions.importsMap)
      analyzeNode(file, analyzedOptions)
      /**
       * 去除后缀
       */
      id = id.replace(/\.\w+$/, '')
      /**
       * 获取文件最后一个 / 后的内容
       */
      const filename = id.split('/').pop()
      let positionDiff = 0
      for (const func of analyzedOptions.functions) {
        const bcode = code.substring(0, func.position[0] + positionDiff)
        const acode = code.substring(func.position[1] + positionDiff)
        const badiff = func.position[1] - func.position[0]
        let funcname = ''
        if (func.type === 'function')
          funcname = func.name

        const payload = buffer.Buffer.from(JSON.stringify(func)).toString('base64')
        const newCode = `\
async function ${funcname}(...args) {
  const token = localStorage.getItem('token')
  return fetch('/viembed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      code: '${filename}-${func.name}',
      data: args,
      func: '${payload}'
    })
  })
    .then(async (res) => {
      const data = await res.json()
      if (!data.success) {
        throw new Error('fail on use server function')
      }
      return data.data
    })
}`
        const newCodeLength = newCode.length
        code = bcode + newCode + acode
        positionDiff += newCodeLength - badiff
      }

      return code
    },
  })
}
