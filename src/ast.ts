import type { FunctionBody } from 'typescript'
import ts from 'typescript'
import type { AnalyzedOptions, ImportedObject, UseServerParams } from './type'

export function extractImports(node: ts.Node, importsMap: Record<string, ImportedObject>) {
  if (ts.isImportDeclaration(node)) {
    const moduleName = node.moduleSpecifier.getText(node.getSourceFile()).replace(/['"]/g, '')
    if (node.importClause) {
      if (node.importClause.name) {
        importsMap[node.importClause.name.text] = {
          type: 'default',
          identifier: node.importClause.name.text,
          moduleName,
        }
      }

      if (node.importClause.namedBindings) {
        if (ts.isNamedImports(node.importClause.namedBindings)) {
          node.importClause.namedBindings.elements.forEach((element) => {
            importsMap[element.name.text] = {
              type: 'named',
              identifier: element.name.text,
              moduleName,
            }
          })
        }
        else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          importsMap[node.importClause.namedBindings.name.text] = {
            type: 'namespace',
            identifier: node.importClause.namedBindings.name.text,
            moduleName,
          }
        }
      }
    }
  }
  ts.forEachChild(node, child => extractImports(child, importsMap))
}

function analyzeFunctionUsage(node: ts.Node, options: AnalyzedOptions, usedImports: ImportedObject[]) {
  function visit(node: ts.Node): void {
    if (ts.isIdentifier(node) && options.importsMap[node.text])
      usedImports.push(options.importsMap[node.text])
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(node, visit)
}

/**
 * 获取所有 "use server" 函数
 *
 * 在这里不用为每个函数单独区分 imports
 * 我们以一个文件为最小单位
 *
 * @param node
 * @param options
 */
export function analyzeNode(node: ts.Node, options: AnalyzedOptions) {
  if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) && node.body && ts.isBlock(node.body)) {
    for (const statement of ((node as unknown as ts.FunctionDeclaration).body as FunctionBody).statements) {
      if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) {
        if (statement.expression.text === 'use server') {
          let functionName = ''
          if (ts.isFunctionDeclaration(node))
            functionName = (node.name as any).text
          else if (ts.isFunctionExpression(node) && node.parent && ts.isVariableDeclaration(node.parent))
            functionName = (node.parent.name as any).text
          else if (ts.isArrowFunction(node) && node.parent && ts.isVariableDeclaration(node.parent))
            functionName = (node.parent.name as any).text
          else
            functionName = 'anonymous'
          const usedImports: ImportedObject[] = []
          analyzeFunctionUsage(node, options, usedImports)
          const params: UseServerParams[] = []
          node.parameters.forEach((param) => {
            /**
             * 对于每个参数，获取其类型
             */
            if (param.name) {
              const _param: UseServerParams = {
                name: (param.name as any).text,
                type: 'any',
              }
              if (param.type)
                _param.type = param.type.getText(node.getSourceFile()!)

              params.push(_param)
            }
          })
          const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
          options.functions.push({
            position: [node.getStart(), node.getEnd()],
            /**
             * function
             *
             * function a() {}
             *
             * arrow
             *
             * const a = () => {}
             *
             * expression
             *
             * const a = function() {}
             */
            type: ts.isFunctionDeclaration(node) ? 'function' : ts.isArrowFunction(node) ? 'arrow' : 'expression',
            name: functionName,
            body: printer.printNode(ts.EmitHint.Unspecified, node.body, node.getSourceFile()!),
            params,
            usedImports,
          })
          break
        }
      }
    }
  }
  ts.forEachChild(node, child => analyzeNode(child, options))
}
