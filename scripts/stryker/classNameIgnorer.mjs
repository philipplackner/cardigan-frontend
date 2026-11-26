import { declareValuePlugin, PluginKind } from '@stryker-mutator/api/plugin'

const CLASS_NAME_FUNCTIONS = new Set(['cn', 'cva'])

const REASON = 'Tailwind class names are styling, not behavior.'

function isClassNameAttribute(path) {
  return (
    path.isJSXAttribute() &&
    path.node.name.type === 'JSXIdentifier' &&
    path.node.name.name === 'className'
  )
}

function isClassNameCall(path) {
  return (
    path.isCallExpression() &&
    path.node.callee.type === 'Identifier' &&
    CLASS_NAME_FUNCTIONS.has(path.node.callee.name)
  )
}

/**
 * Ignores mutants inside a `className` attribute or a `cn()`/`cva()` call.
 * Stryker also ignores every descendant of a matched node.
 */
export const classNameIgnorer = {
  shouldIgnore(path) {
    return isClassNameAttribute(path) || isClassNameCall(path)
      ? REASON
      : undefined
  },
}

export const strykerPlugins = [
  declareValuePlugin(PluginKind.Ignore, 'class-names', classNameIgnorer),
]
