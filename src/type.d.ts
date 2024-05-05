export interface ImportedObject {
  type: 'default' | 'named' | 'namespace'
  identifier: string
  moduleName: string
}

export interface UseServerParams {
  name: string
  type: string
}

export interface UseServerFunction {
  body: string
  name: string
  type: 'function' | 'arrow' | 'expression'
  position: [number, number]
  params: UseServerParams[]
  usedImports: ImportedObject[]
}

export interface AnalyzedOptions {
  importsMap: Record<string, ImportedObject>
  functions: UseServerFunction[]
}

export interface JsrpcPluginOptions {
  /**
   * 自定义过滤器，如果返回 false 则不认为该文件是 viembed 文件
   *
   * @param id
   */
  filter?: (id: string) => boolean
  /**
   * 自定义配置文件名，默认为 viembed.config.ts
   */
  config?: string
  /**
   * vite port
   */
  vitePort?: number
}
