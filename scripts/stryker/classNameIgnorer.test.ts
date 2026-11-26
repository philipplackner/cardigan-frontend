import { parseSync, traverse, type NodePath } from '@babel/core'
import { describe, expect, it } from 'vitest'
import { classNameIgnorer, strykerPlugins } from './classNameIgnorer.mjs'

type Visit = { text: string; ignored: boolean }

/** Walks [code] the way Stryker's ignorer bookkeeping does: a match ignores the node and all its descendants. */
function visit(code: string): Visit[] {
  const ast = parseSync(code, {
    configFile: false,
    babelrc: false,
    parserOpts: { plugins: ['jsx', 'typescript'] },
  })
  if (!ast) throw new Error('Parse failed')
  const visits: Visit[] = []
  let activeNode: unknown
  traverse(ast, {
    enter(path: NodePath) {
      if (!activeNode && classNameIgnorer.shouldIgnore(path)) {
        activeNode = path.node
      }
      const { start, end } = path.node
      visits.push({
        text: code.slice(start ?? 0, end ?? 0),
        ignored: activeNode !== undefined,
      })
    },
    exit(path: NodePath) {
      if (activeNode === path.node) activeNode = undefined
    },
  })
  return visits
}

function isIgnored(code: string, text: string): boolean {
  const matches = visit(code).filter((v) => v.text === text)
  if (matches.length === 0) throw new Error(`No node with text: ${text}`)
  return matches.every((v) => v.ignored)
}

describe('classNameIgnorer', () => {
  it('ignores a className string', () => {
    const code = `const a = <div className="flex gap-8" />`
    expect(isIgnored(code, '"flex gap-8"')).toBe(true)
  })

  it('ignores a className template literal', () => {
    const code = 'const a = <div className={`flex ${gap}`} />'
    expect(isIgnored(code, '`flex ${gap}`')).toBe(true)
  })

  it('ignores a conditional inside cn() in a className', () => {
    const code = `const a = <div className={cn('flex gap-8', isActive && 'bg-accent')} />`
    expect(isIgnored(code, "isActive && 'bg-accent'")).toBe(true)
    expect(isIgnored(code, "'bg-accent'")).toBe(true)
    expect(isIgnored(code, 'isActive')).toBe(true)
  })

  it('ignores cn() outside a className attribute', () => {
    const code = `const classes = cn('p-4', open ? 'block' : 'hidden')`
    expect(isIgnored(code, "open ? 'block' : 'hidden'")).toBe(true)
  })

  it('ignores cva() arguments', () => {
    const code = `const variants = cva('inline-flex', { variants: { size: { sm: 'h-8', md: 'h-10' } }, defaultVariants: { size: 'md' } })`
    expect(isIgnored(code, "'inline-flex'")).toBe(true)
    expect(isIgnored(code, "'h-8'")).toBe(true)
    expect(isIgnored(code, "defaultVariants: { size: 'md' }")).toBe(true)
  })

  it('does not ignore an onClick handler on the same element', () => {
    const code = `const a = <button className={cn('p-2', active && 'bg-accent')} onClick={() => onSelect(id)} />`
    expect(isIgnored(code, '() => onSelect(id)')).toBe(false)
    expect(isIgnored(code, 'onSelect(id)')).toBe(false)
  })

  it('does not ignore other string attributes', () => {
    const code = `const a = <button className="p-2" aria-label={t('board.close')} />`
    expect(isIgnored(code, "'board.close'")).toBe(false)
  })

  it('does not ignore functions whose names only resemble cn', () => {
    const code = `const a = cnx('p-2', x && 'y'); const b = classNames('p-2', x && 'y')`
    expect(isIgnored(code, "cnx('p-2', x && 'y')")).toBe(false)
    expect(isIgnored(code, "classNames('p-2', x && 'y')")).toBe(false)
  })

  it('does not ignore a cn member call on another object', () => {
    const code = `const a = utils.cn('p-2')`
    expect(isIgnored(code, "'p-2'")).toBe(false)
  })

  it('returns no reason for nodes outside class names', () => {
    const code = `const a = 1 + 2`
    expect(visit(code).some((v) => v.ignored)).toBe(false)
  })

  it('is declared as the class-names ignore plugin', () => {
    expect(strykerPlugins).toEqual([
      expect.objectContaining({
        kind: 'Ignore',
        name: 'class-names',
        value: classNameIgnorer,
      }),
    ])
  })
})
