// noinspection JSUnusedGlobalSymbols

import type { ZodType, input, output } from 'zod'

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

export declare type ZodTypeAny = ZodType<any, any, any>
export declare type Ctx = any
type EnsurePromise<T> = T extends PromiseLike<unknown> ? T : Promise<T>
type Await<T> = T extends PromiseLike<infer U> ? U : T
interface ResultWithContext<Result = unknown, Context = unknown> {
  __blitz: true
  value: Result
  ctx: Context
}
type PipeFn<Prev, Next, PrevCtx, NextCtx = PrevCtx> = (i: Await<Prev>, c: PrevCtx) => Next extends ResultWithContext ? never : Next | ResultWithContext<Next, NextCtx>

/**
 * use case
 *
 * const a = pipe(zodResolver(z.object({
 *   name: z.string(),
 *   age: z.number(),
 * })), (i) => {
 *   console.log(i.name, i.age)
 *   return 'any'
 * })
 *
 * a({ name: '', age: 18 }, {})
 *
 * @param ab
 * @param bc
 */
declare function pipe<A, B, C, CA = Ctx, CB = CA, CC = CB>(ab: PipeFn<A, B, CA, CB>, bc: PipeFn<B, C, CB, CC>): (input: A, ctx: CA) => EnsurePromise<C>
declare function zod<Schema extends ZodTypeAny, InputType = input<Schema>, OutputType = output<Schema>>(schema: Schema): (input: InputType) => Promise<OutputType>
