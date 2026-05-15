/// <reference types="@mastergo/plugin-typings" />

// ─────────────────────────────────────────────
//  Design token → Android color resource name
// ─────────────────────────────────────────────
const DESIGN_TOKEN_MAP: Record<string, string> = {
  "Primary_index_1/Primary":      "x_color_primary",
  "Primary_index_1/Primary_low":  "x_color_primary_low",
  "Label/Text_Positive_T1":       "x_color_text_positive_t1",
  "Label/Text_Positive_T2":       "x_color_text_positive_t2",
  "Label/Text_Positive_T3":       "x_color_text_positive_t3",
  "Label/Text_Positive_T4":       "x_color_text_positive_t4",
  "Label/Text_Negative_T1":       "x_color_text_negative_t1",
  "Label/Text_Negative_T2":       "x_color_text_negative_t2",
  "Label/Text_Negative_T3":       "x_color_text_negative_t3",
  "Label/Text_Negative_T4":       "x_color_text_negative_t4",
  "Fill/Fill_Positive_F1":        "x_color_fill_positive_f1",
  "Fill/Fill_Positive_F2":        "x_color_fill_positive_f2",
  "Fill/Fill_Positive_F3":        "x_color_fill_positive_f3",
  "Fill/Fill_Positive_F4":        "x_color_fill_positive_f4",
  "Fill/Fill_Positive_F5":        "x_color_fill_positive_f5",
  "Fill/Fill_Negative_F1":        "x_color_fill_negative_f1",
  "Fill/Fill_Negative_F2":        "x_color_fill_negative_f2",
  "Fill/Fill_Negative_F3":        "x_color_fill_negative_f3",
  "Fill/Fill_Negative_F4":        "x_color_fill_negative_f4",
  "Fill/Fill_Negative_F5":        "x_color_fill_negative_f5",
  "Static_Color/White_S1":        "x_color_white_s1",
  "Static_Color/White_S2":        "x_color_white_s2",
  "Static_Color/White_S3":        "x_color_white_s3",
  "Static_Color/White_S4":        "x_color_white_s4",
  "Static_Color/Black_S1":        "x_color_black_s1",
  "Static_Color/Black_S2":        "x_color_black_s2",
  "Static_Color/Black_S3":        "x_color_black_s3",
  "Static_Color/Black_S4":        "x_color_black_s4",
  "BG/BG_Toast":                  "x_color_bg_toast",
  "BG/BG_Primary":                "x_color_bg_primary",
  "BG/BG_Pop":                    "x_color_bg_pop",
  "BG/BG_Mask":                   "x_color_bg_mask",
  "BG/BG_Placeholder":            "x_color_bg_placeholder",
  "Funticon color/Red":           "x_color_red",
  "Funticon color/Red_low":       "x_color_red_low",
  "Funticon color/Green":         "x_color_green",
  "Funticon color/Green_low":     "x_color_green_low",
  "Funticon color/Blue":          "x_color_blue",
  "Funticon color/Blue_low":      "x_color_blue_low",
  "Funticon color/Orange":        "x_color_orange",
  "Funticon color/Orange_low":    "x_color_orange_low",
  "Funticon color/Yellow":        "x_color_yellow",
  "Funticon color/Yellow_low":    "x_color_yellow_low",
  "Funticon color/Cyan":          "x_color_cyan",
  "Funticon color/Cyan_low":      "x_color_cyan_low",
  "Outher/Line":                  "x_color_line",
  "Outher/Tbt_no_blur":           "x_color_tbt_no_blur",
  "Outher/AI_widget_BG1":         "x_color_ai_widget_bg1",
  "Outher/AI_widget_BG2":         "x_color_ai_widget_bg2",
}

// ─────────────────────────────────────────────
//  SVG → Android Vector XML parser
// ─────────────────────────────────────────────

interface ParsedPath {
  pathData: string
  fillColor: string
  fillAlpha: number
  fillType: string
}

interface ParsedGroup {
  alpha: number
  children: (ParsedPath | ParsedGroup)[]
}

function parseColor(color: string): string {
  if (!color || color === 'none' || color === 'transparent') return ''
  color = color.trim()
  if (color.startsWith('#')) {
    if (color.length === 4) return '#' + color[1]+color[1]+color[2]+color[2]+color[3]+color[3]
    return color.toUpperCase()
  }
  const rgbaMatch = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (rgbaMatch) {
    const r = Math.round(parseFloat(rgbaMatch[1])).toString(16).padStart(2,'0')
    const g = Math.round(parseFloat(rgbaMatch[2])).toString(16).padStart(2,'0')
    const b = Math.round(parseFloat(rgbaMatch[3])).toString(16).padStart(2,'0')
    return '#' + r + g + b
  }
  return color
}

function parseOpacity(style: string, attr: string): number {
  const m = style.match(/(?:^|;)\s*opacity\s*:\s*([\d.]+)/)
  if (m) return parseFloat(m[1])
  if (attr) return parseFloat(attr)
  return 1
}

function parseFill(style: string, attr: string): string {
  const m = style.match(/(?:^|;)\s*fill\s*:\s*([^;]+)/)
  if (m) return m[1].trim()
  return attr || ''
}

function parseFillRule(style: string, attr: string): string {
  const m = style.match(/fill-rule\s*:\s*([^;]+)/)
  if (m) return m[1].trim()
  return attr || 'nonzero'
}

function parseAttrs(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const re = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
  let m
  while ((m = re.exec(attrString)) !== null) {
    attrs[m[1]] = m[2] !== undefined ? m[2] : m[3]
  }
  return attrs
}

function r6(n: number): string {
  return parseFloat(n.toFixed(6)).toString()
}

interface SvgParseContext {
  tokenMap: Record<string, string>
}

interface SvgParseResult {
  width: number
  height: number
  viewBox: [number, number, number, number]
  children: (ParsedPath | ParsedGroup)[]
}

function parseSVG(svgStr: string, ctx: SvgParseContext): SvgParseResult {
  svgStr = svgStr.replace(/<\?xml[^>]*\?>/g, '').replace(/<!--[\s\S]*?-->/g, '')
  const svgMatch = svgStr.match(/<svg([^>]*)>/)
  const svgAttrs = svgMatch ? parseAttrs(svgMatch[1]) : {}
  const vbParts = (svgAttrs['viewBox'] || '0 0 24 24').split(/[\s,]+/).map(Number)
  const width = parseFloat(svgAttrs['width'] || String(vbParts[2]))
  const height = parseFloat(svgAttrs['height'] || String(vbParts[3]))
  const viewBox: [number, number, number, number] = [vbParts[0], vbParts[1], vbParts[2], vbParts[3]]
  const innerSvg = svgStr.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')
  const children = parseElements(innerSvg, ctx)
  return { width, height, viewBox, children }
}

type SvgElement = ParsedPath | ParsedGroup

// MasterGo exportAsync: path coordinates are already absolute canvas coordinates.
// Any <g transform> in the SVG is a redundant description of the same canvas transform
// — the transform is already baked into the path coords. We must NOT apply it again.
// We only care about <g opacity> for alpha folding.
function parseElements(html: string, ctx: SvgParseContext): SvgElement[] {
  const results: SvgElement[] = []
  const tokenRe = /<(\/?)(\w+)([^>]*?)(\/?)>/g
  let m: RegExpExecArray | null
  const stack: { tag: string; attrs: Record<string, string>; children: SvgElement[] }[] = []

  while ((m = tokenRe.exec(html)) !== null) {
    const [, closing, tag, attrStr, selfClosing] = m
    const attrs = parseAttrs(attrStr)

    if (closing === '/') {
      if (stack.length > 0) {
        const top = stack.pop()!
        if (top.tag === 'g') {
          const style = top.attrs['style'] || ''
          const opacity = parseOpacity(style, top.attrs['opacity'] || '')
          // Only wrap in alpha group if opacity < 1; ignore all transforms
          let elements: SvgElement[] = top.children
          if (opacity < 0.999) {
            elements = [{ alpha: opacity, children: top.children }]
          }
          if (stack.length > 0) {
            for (const el of elements) (stack[stack.length-1].children as SvgElement[]).push(el)
          } else {
            for (const el of elements) results.push(el)
          }
        }
      }
      continue
    }

    if (tag === 'path') {
      const path = buildPath(attrs, ctx)
      if (path) {
        if (stack.length > 0) stack[stack.length - 1].children.push(path)
        else results.push(path)
      }
    } else if (tag === 'g' && !selfClosing) {
      stack.push({ tag: 'g', attrs, children: [] })
    }
  }
  return results
}

function buildPath(attrs: Record<string, string>, ctx: SvgParseContext): ParsedPath | null {
  const style = attrs['style'] || ''
  const fill = parseFill(style, attrs['fill'] || '')
  if (fill === 'none' || fill === '') return null
  const pathData = attrs['d'] || ''
  if (!pathData) return null

  const elementOpacity = parseOpacity(style, attrs['opacity'] || '')
  const fillRule = parseFillRule(style, attrs['fill-rule'] || '')
  const fillType = fillRule === 'evenodd' ? 'evenOdd' : 'nonZero'
  const fillColor = parseColor(fill).toUpperCase()

  return { pathData, fillColor, fillAlpha: elementOpacity, fillType }
}

function serializeAndroidXml(result: SvgParseResult, filename: string): string {
  const lines: string[] = []
  lines.push(`<?xml version="1.0" encoding="utf-8"?>`)
  lines.push(`<!-- ${filename} -->`)
  const vbW = result.viewBox[2], vbH = result.viewBox[3]
  lines.push(`<vector xmlns:android="http://schemas.android.com/apk/res/android"`)
  lines.push(`    android:width="${r6(result.width)}dp"`)
  lines.push(`    android:height="${r6(result.height)}dp"`)
  lines.push(`    android:viewportWidth="${r6(vbW)}"`)
  lines.push(`    android:viewportHeight="${r6(vbH)}">`)
  lines.push(``)

  // MasterGo exportAsync SVG path data is already in local component coordinates.
  // No coordinate correction needed — just serialize directly.
  for (const child of result.children) serializeElement(child, lines, 1)

  lines.push(`</vector>`)
  return lines.join('\n')
}

function serializeElement(el: SvgElement, lines: string[], depth: number, inheritAlpha: number = 1): void {
  const indent = '    '.repeat(depth)
  if ('pathData' in el) {
    const p = el as ParsedPath
    const finalAlpha = p.fillAlpha * inheritAlpha
    lines.push(`${indent}<path`)
    lines.push(`${indent}    android:fillColor="${p.fillColor}"`)
    if (finalAlpha < 0.999) lines.push(`${indent}    android:fillAlpha="${r6(finalAlpha)}"`)
    if (p.fillType === 'evenOdd') lines.push(`${indent}    android:fillType="evenOdd"`)
    lines.push(`${indent}    android:pathData="${p.pathData}"`)
    lines.push(`${indent}/>`)
  } else {
    // ParsedGroup now only carries alpha (all transforms baked into path coords)
    const g = el as ParsedGroup
    for (const child of g.children) {
      serializeElement(child, lines, depth, inheritAlpha * g.alpha)
    }
  }
}

// ─────────────────────────────────────────────
//  Color token extraction via fillStyleId
// ─────────────────────────────────────────────

async function extractColorTokens(node: SceneNode): Promise<Record<string, string>> {
  const tokenByColor: Record<string, string> = {}

  function walk(n: SceneNode) {
    const fillStyleId: string = (n as any).fillStyleId || ''
    if (fillStyleId) {
      try {
        const style = mg.getStyleById(fillStyleId) as any
        if (style && style.name) {
          const tokenName: string = style.name
          const fills = (n as any).fills as Paint[] | undefined
          if (fills) {
            for (const fill of fills) {
              if (fill.type === 'SOLID') {
                const c = (fill as SolidPaint).color
                const r = Math.round(c.r * 255).toString(16).padStart(2, '0')
                const g = Math.round(c.g * 255).toString(16).padStart(2, '0')
                const b = Math.round(c.b * 255).toString(16).padStart(2, '0')
                tokenByColor[('#' + r + g + b).toUpperCase()] = tokenName
              }
            }
          }
        }
      } catch {}
    }
    if ('children' in n) {
      for (const child of (n as any).children) walk(child)
    }
  }

  walk(node)
  return tokenByColor
}

function applyTokenColors(children: (ParsedPath | ParsedGroup)[], tokenByColor: Record<string, string>): void {
  for (const el of children) {
    if ('pathData' in el) {
      const p = el as ParsedPath
      const token = tokenByColor[p.fillColor.toUpperCase()]
      if (token) {
        const code = DESIGN_TOKEN_MAP[token]
        if (code) p.fillColor = `@color/${code}`
      }
    } else {
      applyTokenColors((el as ParsedGroup).children, tokenByColor)
    }
  }
}

// ─────────────────────────────────────────────
//  Scan page for ic_ components
// ─────────────────────────────────────────────

interface IconMeta {
  id: string
  name: string
  width: number
  height: number
  hardcoded: string[]
  nameError: string  // empty = ok, otherwise reason
}

function checkNameError(name: string): string {
  if (/[一-鿿㐀-䶿]/.test(name)) return '含中文'
  if (name.includes('-')) return '含"-"'
  if (name.includes(' ')) return '含空格'
  if (/[A-Z]/.test(name)) return '含大写'
  return ''
}

function getHardcodedColors(node: SceneNode): string[] {
  const colors = new Set<string>()

  function walk(n: SceneNode) {
    const fillStyleId: string = (n as any).fillStyleId || ''
    const fills = (n as any).fills as Paint[] | undefined
    if (fills && fills.length > 0 && !fillStyleId) {
      for (const fill of fills) {
        if (fill.type === 'SOLID' && (fill as SolidPaint).color) {
          const c = (fill as SolidPaint).color
          const r = Math.round(c.r * 255).toString(16).padStart(2, '0')
          const g = Math.round(c.g * 255).toString(16).padStart(2, '0')
          const b = Math.round(c.b * 255).toString(16).padStart(2, '0')
          colors.add(('#' + r + g + b).toUpperCase())
        }
      }
    }
    if ('children' in n) {
      for (const child of (n as any).children) walk(child)
    }
  }

  walk(node)
  return [...colors]
}

function scanPageForIcons(): IconMeta[] {
  const page = mg.document.currentPage
  const selected = page.selection

  if (selected.length === 0) return []

  const icons: IconMeta[] = []

  function walk(node: SceneNode) {
    if (node.type === 'COMPONENT' && node.name.startsWith('ic_')) {
      const w = 'width' in node ? (node as FrameNode).width : 24
      const h = 'height' in node ? (node as FrameNode).height : 24
      icons.push({ id: node.id, name: node.name, width: w, height: h, hardcoded: getHardcodedColors(node), nameError: checkNameError(node.name) })
    }
    if ('children' in node) {
      for (const child of (node as any).children) walk(child)
    }
  }

  for (const node of selected) walk(node)

  // Mark duplicates
  const nameCounts = new Map<string, number>()
  for (const ic of icons) nameCounts.set(ic.name, (nameCounts.get(ic.name) || 0) + 1)
  for (const ic of icons) {
    if (!ic.nameError && (nameCounts.get(ic.name) || 0) > 1) ic.nameError = '重名'
  }

  icons.sort((a, b) => a.name.localeCompare(b.name))
  return icons
}

// ─────────────────────────────────────────────
//  Export selected nodes by ID
// ─────────────────────────────────────────────

async function exportNodes(ids: string[]): Promise<void> {
  const page = mg.document.currentPage
  const results: { name: string; xml: string }[] = []
  const warnings: string[] = []
  const total = ids.length
  let done = 0

  for (const id of ids) {
    const node = mg.getNodeById(id) as SceneNode | null
    if (!node) {
      warnings.push(`找不到节点 ID：${id}`)
      continue
    }

    const iconName = node.name
    mg.ui.postMessage({ type: 'PROGRESS', message: `正在处理：${iconName}`, done, total })

    try {
      const svgResult = await (node as any).exportAsync({ format: 'SVG' })
      const svgStr: string = typeof svgResult === 'string'
        ? svgResult
        : new TextDecoder().decode(svgResult as Uint8Array)

      const tokenByColor = await extractColorTokens(node)
      const ctx: SvgParseContext = { tokenMap: {} }
      const parsed = parseSVG(svgStr, ctx)
      applyTokenColors(parsed.children, tokenByColor)

      // Use node's actual integer dimensions instead of SVG-parsed values (which can have float errors)
      const nodeW = 'width' in node ? Math.round((node as FrameNode).width) : Math.round(parsed.width)
      const nodeH = 'height' in node ? Math.round((node as FrameNode).height) : Math.round(parsed.height)
      parsed.width = nodeW
      parsed.height = nodeH
      // Also round viewportWidth/Height to nearest integer
      parsed.viewBox[2] = Math.round(parsed.viewBox[2])
      parsed.viewBox[3] = Math.round(parsed.viewBox[3])

      const xml = serializeAndroidXml(parsed, iconName)
      results.push({ name: iconName, xml })
    } catch (err: any) {
      warnings.push(`处理失败：${iconName}（${err?.message || String(err)}）`)
    }

    done++
    mg.ui.postMessage({ type: 'PROGRESS', message: `已完成：${iconName}`, done, total })
  }

  mg.ui.postMessage({ type: 'EXPORT_RESULT', results, warnings })
}

// ─────────────────────────────────────────────
//  Plugin entry
// ─────────────────────────────────────────────

mg.showUI(__html__, { width: 480, height: 640 })

// Auto-scan selected on open
const icons = scanPageForIcons()
mg.ui.postMessage({ type: 'PAGE_ICONS', icons, noSelection: icons.length === 0 && mg.document.currentPage.selection.length === 0 })

mg.ui.onmessage = async (rawMsg: any) => {
  const msg = (rawMsg && rawMsg.pluginMessage !== undefined)
    ? rawMsg.pluginMessage
    : rawMsg

  if (!msg || !msg.type) return

  if (msg.type === 'RESCAN') {
    const icons = scanPageForIcons()
    mg.ui.postMessage({ type: 'PAGE_ICONS', icons })
    return
  }

  if (msg.type === 'EXPORT_IDS') {
    await exportNodes(msg.ids as string[])
    return
  }
}
