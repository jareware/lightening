import React from 'react'

export function Icon(props: {
  name: keyof typeof icons
  location: [x: number, y: number]
  on?: boolean
  onClick?: () => void
}) {
  const r = size / 2
  return (
    <g transform={`translate(${props.location})`} onClick={props.onClick}>
      <circle
        cx={r}
        cy={r}
        r={r + 15}
        fill="transparent" // i.e. some extra touch area
      />
      <circle
        cx={r}
        cy={r}
        r={r + 4}
        fill={props.on ? '#e8d100' : 'lightgray'}
        // stroke-width=".05"
        // stroke="black"
      />
      <g transform={`scale(0.75)`} transform-origin={`${r} ${r}`} fill="black">
        {icons[props.name]}
      </g>
    </g>
  )
}

/**
 * @see https://fonts.google.com/icons with "Outlined" and Fill=1 & export as SVG
 */
const icons = {
  Park: (
    <path d="M26.9 44h-5.75v-7.45H6l9.45-13.7H10.7L24 4l13.3 18.85h-4.7l9.4 13.7H26.9Z" />
  ),
  'Door Sensor': (
    <path d="M17 42q-1.25 0-2.125-.875T14 39v-6h10q1.25 0 2.125-.875T27 30q0-1.25-.875-2.125T24 27H14V9q0-1.25.875-2.125T17 6h14q1.25 0 2.125.875T34 9v30q0 1.25-.875 2.125T31 42ZM9.5 31.5q-.65 0-1.075-.425Q8 30.65 8 30q0-.65.425-1.075Q8.85 28.5 9.5 28.5H24q.65 0 1.075.425.425.425.425 1.075 0 .65-.425 1.075-.425.425-1.075.425Zm14.5-12q.65 0 1.075-.425.425-.425.425-1.075 0-.65-.425-1.075Q24.65 16.5 24 16.5q-.65 0-1.075.425Q22.5 17.35 22.5 18q0 .65.425 1.075.425.425 1.075.425Zm16.5-2q-.65 0-1.075-.425Q39 16.65 39 16V8q0-.65.425-1.075Q39.85 6.5 40.5 6.5q.65 0 1.075.425Q42 7.35 42 8v8q0 .65-.425 1.075-.425.425-1.075.425Z" />
  ),
  'Tv Gen': (
    <path d="M8.5 42v-4H7q-1.25 0-2.125-.875T4 35V11q0-1.25.875-2.125T7 8h34q1.25 0 2.125.875T44 11v24q0 1.25-.875 2.125T41 38h-1.5v4h-1.15l-1.3-4H11l-1.35 4ZM7 35h34V11H7v24Zm0-24h34v24H7Z" />
  ),
}

/**
 * This comes from <svg height="48" width="48"> in the source icons
 */
const size = 48
