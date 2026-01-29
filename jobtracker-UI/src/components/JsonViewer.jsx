import React, { useState } from 'react'

function isObject(x) {
  return x && typeof x === 'object' && !Array.isArray(x)
}

function renderValue(val) {
  if (val === null) return <span style={{ color: '#a71d5d' }}>null</span>
  if (typeof val === 'string') return <span style={{ color: '#0b7500' }}>&quot;{val}&quot;</span>
  if (typeof val === 'number') return <span style={{ color: '#1c00cf' }}>{String(val)}</span>
  if (typeof val === 'boolean') return <span style={{ color: '#aa0d91' }}>{String(val)}</span>
  return <span>{String(val)}</span>
}

export default function JsonViewer({ data, collapsedDepth = 1 }) {
  const [expanded, setExpanded] = useState(new Set())

  function toggle(path, depth) {
    const key = String(path)
    const next = new Set(expanded)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setExpanded(next)
  }

  function isExpanded(path, depth) {
    const key = String(path)
    if (expanded.has(key)) return true
    return depth < collapsedDepth
  }

  function Node({ node, name, path = '', depth = 0 }) {
    if (Array.isArray(node)) {
      const opened = isExpanded(path, depth)
      return (
        <div style={{ marginLeft: depth * 12 }}>
          <div style={{ cursor: 'pointer' }} onClick={() => toggle(path, depth)}>
            <strong>{opened ? '▾' : '▸'}</strong> {name}: Array[{node.length}]
          </div>
          {opened && node.map((v, i) => (
            <Node key={i} node={v} name={i} path={`${path}.${i}`} depth={depth + 1} />
          ))}
        </div>
      )
    }

    if (isObject(node)) {
      const keys = Object.keys(node)
      const opened = isExpanded(path, depth)
      return (
        <div style={{ marginLeft: depth * 12 }}>
          <div style={{ cursor: 'pointer' }} onClick={() => toggle(path, depth)}>
            <strong>{opened ? '▾' : '▸'}</strong> {name}: Object{keys.length ? ` {${keys.length}}` : ''}
          </div>
          {opened && keys.map(k => (
            <Node key={k} node={node[k]} name={k} path={`${path}.${k}`} depth={depth + 1} />
          ))}
        </div>
      )
    }

    return (
      <div style={{ marginLeft: depth * 12 }}>
        <span style={{ color: '#666' }}>{name}:</span> {renderValue(node)}
      </div>
    )
  }

  if (!data) return <div style={{ color: '#666' }}>No JSON</div>

  return (
    <div style={{ fontFamily: 'Menlo, monospace', fontSize: 13 }}>
      <Node node={data} name={'root'} path={'root'} depth={0} />
    </div>
  )
}
