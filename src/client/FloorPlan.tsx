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
            [725, 348],
            [918, 314],
            [966, 560],
            [773, 594],
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
            [32, 27],
            [32, 40], // note: finishing with "Z" won't render correctly on Safari → draw a bit over the existing line
          ])}
          dash="0 1086 70 492 94 26 50 67 139 15 55 147 160 181 50 34 107 85 93 18 49 0"
        />
        <Wall
          note="makkari"
          path={toPath([
            [274, 27],
            [274, 335],
            [32, 335],
          ])}
          dash="0 230 55 148 55 0"
        />
        <Wall
          note="käytävän vasen seinä"
          path={toPath([
            [230, 335],
            [230, 585],
            [274, 585],
            [274, 845],
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
            [230, 455],
            [230, 482],
            [169, 482],
          ])}
          filled
        />
        <Wall
          note="kylppärin ja vaatehuoneen väliseinä"
          path={toPath([
            [32, 482],
            [230, 482],
          ])}
          dash="0 59 55 100 0"
        />
        <Wall
          note="saunan väliseinä"
          path={toPath([
            [32, 720],
            [200, 720],
          ])}
          dash="0 90 55 0"
        />
        <Wall
          note="pikkuvessan seinä"
          path={toPath([
            [274, 685],
            [200, 685],
            [200, 845],
          ])}
        />
        <Wall
          note="keittiön oikea seinä"
          path={toPath([
            [382, 336],
            [427, 336],
            [427, 585],
            [382, 585],
          ])}
        />
        <Wall
          note="siivouskaapin ovi"
          path={toPath([
            [510, 585],
            [510, 640],
          ])}
          light
        />
        <Wall
          note="Emman huoneen seinä 1"
          path={toPath([
            [773, 594],
            [510, 640],
            [510, 733],
            [399, 733],
          ])}
          dash="0 285 55 0"
        />
        <Wall
          note="Emman huoneen seinä 2"
          path={toPath([
            [460, 733],
            [460, 845],
          ])}
        />
        <Wall
          note="siivouskaapin ulkoseinä"
          path={toPath([
            [427, 585],
            [610, 585],
            [616, 621.5],
          ])}
          dash="0 18 55 170 0"
        />
        <Wall
          note="olohuoneen ja työhuoneen väliseinä"
          path={toPath([
            [427, 365],
            [722, 333],
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

function toPath(path: [number, number][]) {
  return path.map((xy, i) => `${i === 0 ? 'M' : 'L'} ${xy.join(' ')}`).join(' ')
}
