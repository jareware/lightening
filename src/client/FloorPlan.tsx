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
          path="M 32 27 v 818 h 790 L 662 27 Z"
          dash="1086 55 507 94 26 50 67 150 5 54 147 160 181 50 34 107 85 93 18 49"
        />
        <Wall path="M 274 27 v 308 h -241" dash="237 55 139 48" />
        <Wall path="M 230 335 v 250 h 44 v 260" dash="313 54 83 54" />
        <Wall path="M 32 456 h 46 v 26 h -46 Z" filled />
        <Wall path="M 158 482 v -27 h 72 v 27 Z" filled />
        <Wall path="M 32 483 h 198" dash="66 48 100" />
        <Wall path="M 32 720 h 168" dash="99 47" />
        <Wall path="M 273 685 h -73 v 160" />
        <Wall path="M 376 336 h 51 v 249 h -58" />
        <Wall path="M 773 594 l -263 46 v 93 h -111" dash="288 54" />
        <Wall path="M 460 734 v 111" />
        <Wall path="M 725 348 l 193 -34 l 48 248 l -194 32" light />
      </svg>
    </div>
  )
}

function Wall(props: {
  path: string
  dash?: string
  filled?: boolean
  light?: boolean
}) {
  const style: CSSProperties = {
    strokeWidth: 15,
    stroke: props.light ? 'lightgray' : 'black',
    fill: props.filled ? 'black' : 'transparent',
    strokeLinecap: 'butt',
    strokeLinejoin: 'miter',
    pointerEvents: 'none', // even though walls are rendered on top of other things, make them click-through
  }
  return (
    <>
      <path
        d={props.path}
        style={{ ...style, stroke: props.dash ? 'lightgray' : 'black' }}
      />
      {props.dash && (
        <path d={props.path} strokeDasharray={props.dash} style={style} />
      )}
    </>
  )
}
