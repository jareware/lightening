import _ from 'lodash'
import React, { CSSProperties, useEffect, useRef, useState } from 'react'
import 'src/client/App.css'

export function FloorPlan() {
  return (
    <div>
      <svg
        version="1.1"
        baseProfile="full"
        viewBox="0 0 860 880" // note: full view is "0 0 1000 880"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxHeight: '80vh' }}
      >
        <Wall
          note="parveke"
          path={toPath([
            [726, 348],
            [918, 314],
            [966, 560],
            [774, 594],
          ])}
          light
        />
        <Wall
          note="ulkoseinät"
          path={toPath([
            [32, 27],
            [32, 845],
            [822, 845],
            [662, 27],
            [24.5, 27], // note: finishing with "Z" won't render correctly on Safari :shrug:
          ])}
          dash="0 1086 70 492 94 26 50 67 139 15 55 147 160 181 50 34 107 85 93 18 49 0"
        />
        <Wall
          note="makkari"
          path={toPath([
            [274, 29],
            [274, 335],
            [34, 335],
          ])}
          dash="0 230 55 148 55 0"
        />
        <Wall
          note="käytävän vasen seinä"
          path={toPath([
            [230, 337],
            [230, 585],
            [274, 585],
            [274, 842],
          ])}
          dash="0 313 55 90 55 0"
        />
        <Wall
          note="vaatehuoneen vasen kotelo"
          path={toPath([
            [32, 456],
            [69, 456],
            [69, 482],
            [32, 482],
            [32, 456],
          ])}
          filled
        />
        <Wall
          note="vaatehuoneen oikea kotelo"
          path={toPath([
            [169, 482],
            [169, 455],
            [224, 455],
            [224, 482],
            [169, 482],
          ])}
          filled
        />
        <Wall
          note="kylppärin ja vaatehuoneen väliseinä"
          path={toPath([
            [32, 483],
            [230, 483],
          ])}
          dash="0 59 55 100 0"
        />
        <Wall
          note="saunan väliseinä"
          path={toPath([
            [34, 720],
            [196, 720],
          ])}
          dash="0 90 55 0"
        />
        <Wall
          note="pikkuvessan seinä"
          path={toPath([
            [271, 685],
            [200, 685],
            [200, 843],
          ])}
        />
        <Wall
          note="keittiön oikea seinä"
          path={toPath([
            [376, 336],
            [427, 336],
            [427, 585],
            [369, 585],
          ])}
        />
        <Wall
          note="siivouskaapin ovi"
          path={toPath([
            [510, 587],
            [510, 637],
          ])}
          light
        />
        <Wall
          note="Emman huoneen seinä 1"
          path={toPath([
            [772, 594],
            [510, 640],
            [510, 733],
            [399, 733],
          ])}
          dash="0 285 55 0"
        />
        <Wall
          note="Emman huoneen seinä 1"
          path={toPath([
            [460, 735],
            [460, 844],
          ])}
        />
        <Wall
          note="siivouskaapin ulkoseinä"
          path={toPath([
            [429, 585],
            [610, 585],
            [616, 621],
          ])}
          dash="0 18 55 170 0"
        />
        <Wall
          note="olohuoneen ja työhuoneen väliseinä"
          path={toPath([
            [430, 365],
            [720, 333],
          ])}
          dash="0 17 55 1000 0"
        />
      </svg>
    </div>
  )
}

function Wall(props: {
  note?: string
  path: string
  dash?: string
  filled?: boolean
  light?: boolean
  highlight?: boolean
}) {
  const style: CSSProperties = {
    strokeWidth: 15,
    stroke: props.highlight ? 'red' : props.light ? 'lightgray' : 'black',
    fill: props.filled ? 'black' : 'transparent',
    strokeLinecap: 'butt',
    strokeLinejoin: 'miter',
    pointerEvents: 'none', // even though walls are rendered on top of other things, make them click-through
  }
  return props.dash ? (
    <>
      <path
        d={props.path}
        style={{ ...style }}
        strokeDasharray={props.dash.replace(/^0 /, '') + ' 0'}
      />
      <path
        d={props.path}
        style={{ ...style, stroke: 'lightgray' }}
        strokeDasharray={props.dash}
      />
    </>
  ) : (
    <path d={props.path} style={style} />
  )
}

function convert(input: string) {
  const parts = input.split(' ')
  const out: number[] = []
  while (parts.length) {
    const cmd = parts.shift()
    if (cmd === 'M') {
      out.push(Number(parts.shift()))
      out.push(Number(parts.shift()))
    } else if (cmd === 'v') {
      const last = _.takeRight(out, 2).map(Number)
      out.push(last[0])
      out.push(last[1] + Number(parts.shift()!))
    } else if (cmd === 'h') {
      const last = _.takeRight(out, 2).map(Number)
      out.push(last[0] + Number(parts.shift()!))
      out.push(last[1])
    } else if (cmd === 'L') {
      out.push(Number(parts.shift()))
      out.push(Number(parts.shift()))
    } else if (cmd === 'l') {
      const last = _.takeRight(out, 2).map(Number)
      out.push(last[0] + Number(parts.shift()!))
      out.push(last[1] + Number(parts.shift()!))
    } else if (cmd === 'Z') {
      const first = _.take(out, 2).map(Number)
      out.push(first[0])
      out.push(first[1])
    } else {
      console.warn('UNKNOWN:', cmd)
    }
  }
  console.log(JSON.stringify(_.chunk(out, 2)))
}

function toPath(path: [number, number][]) {
  return path.map((xy, i) => `${i === 0 ? 'M' : 'L'} ${xy.join(' ')}`).join(' ')
}
