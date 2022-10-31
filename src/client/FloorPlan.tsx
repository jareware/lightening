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
          path="M 726 348 l 192 -34 l 48 246 l -192 34"
          light
        />
        <Wall
          note="ulkoseinät"
          path="M 32 27 v 818 h 790 L 662 27 Z"
          dash="0 1086 70 492 94 26 50 67 139 15 55 147 160 181 50 34 107 85 93 18 49 0"
        />
        <Wall
          note="makkari"
          path="M 274 29 v 306 h -240"
          dash="0 230 55 148 55 0"
        />
        <Wall
          note="käytävän vasen seinä"
          path="M 230 337 v 248 h 44 v 257"
          dash="0 313 55 90 55 0"
        />
        <Wall
          note="vaatehuoneen vasen kotelo"
          path="M 32 456 h 37 v 26 h -37 Z"
          filled
        />
        <Wall
          note="vaatehuoneen oikea kotelo"
          path="M 169 482 v -27 h 55 v 27 Z"
          filled
        />
        <Wall
          note="kylppärin ja vaatehuoneen väliseinä"
          path="M 32 483 h 198"
          dash="0 59 55 100 0"
        />
        <Wall note="saunan väliseinä" path="M 34 720 h 162" dash="0 90 55 0" />
        <Wall note="pikkuvessan seinä" path="M 271 685 h -71 v 158" />
        <Wall note="keittiön oikea seinä" path="M 376 336 h 51 v 249 h -58" />
        <Wall note="siivouskaapin ovi" path="M 510 587 v 50" light />
        <Wall
          note="Emman huoneen seinä 1"
          path="M 772 594 l -262 46 v 93 h -111"
          dash="0 285 55 0"
        />
        <Wall note="Emman huoneen seinä 1" path="M 460 735 v 109" />
        <Wall
          note="siivouskaapin ulkoseinä"
          path="M 429 585 h 181 l 6 36"
          dash="0 18 55 170 0"
        />
        <Wall
          note="olohuoneen ja työhuoneen väliseinä"
          path="M 430 365 l 290 -32"
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
  return (
    <>
      <path d={props.path} style={style} />
      {props.dash && (
        <path
          d={props.path}
          style={{ ...style, stroke: 'lightgray' }}
          strokeDasharray={props.dash}
        />
      )}
    </>
  )
}
