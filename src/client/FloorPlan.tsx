import _ from 'lodash'
import React, { CSSProperties, useEffect, useRef, useState } from 'react'
import 'src/client/App.css'
import { Icon } from 'src/client/Icon'
import { LightGroups } from 'src/server/state'

export function FloorPlan(props: {
  state: LightGroups
  send: (data: string) => void | undefined
}) {
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
        <Zone
          note="työhuone"
          path={[
            [427, 365],
            [722, 333],
            [773, 594],
            [616, 621.5],
            [610, 585],
            [427, 585],
            [427, 365],
          ]}
          on={isOn(props.state, 'työhuone_group')}
          onClick={() =>
            props.send(
              JSON.stringify({
                device: 'työhuone_group',
                brightness: isOn(props.state, 'työhuone_group') ? 0 : 254,
              }),
            )
          }
        />

        <Zone
          note="olohuone"
          path={[
            [722, 333],
            [662, 27],
            [427, 27],
            [427, 336],
            [427, 365],
            [722, 333],
          ]}
          on={isOn(props.state, 'olkkari_group')}
          onClick={() =>
            props.send(
              JSON.stringify({
                device: 'olkkari_group',
                brightness: isOn(props.state, 'olkkari_group') ? 0 : 254,
              }),
            )
          }
        />

        <Zone
          note="ruokapöytä"
          path={[
            [274, 27],
            [274, 335],
            [427, 336],
            [427, 27],
            [274, 27],
          ]}
          on={isOn(props.state, 'ruokapöytä_group')}
          onClick={() =>
            props.send(
              JSON.stringify({
                device: 'ruokapöytä_group',
                brightness: isOn(props.state, 'ruokapöytä_group') ? 0 : 254,
              }),
            )
          }
        />

        <Zone
          note="keittiö"
          path={[
            [382, 336],
            [382, 585],
            [274, 585],
            [274, 335],
            [382, 336],
          ]}
          on={isOn(props.state, 'keittiö_group')}
          onClick={() =>
            props.send(
              JSON.stringify({
                device: 'keittiö_group',
                brightness: isOn(props.state, 'keittiö_group') ? 0 : 254,
              }),
            )
          }
        />

        <Zone
          note="pitkä työtaso"
          path={[
            [281, 335],
            [230, 335],
            [230, 585],
            [281, 585],
            [281, 335],
          ]}
          on={isOn(props.state, 'tiskipöytä_group')}
          onClick={() =>
            props.send(
              JSON.stringify({
                device: 'tiskipöytä_group',
                brightness: isOn(props.state, 'tiskipöytä_group') ? 0 : 254,
              }),
            )
          }
        />

        <Zone
          note="lyhyt työtaso"
          path={[
            [376, 336],
            [427, 336],
            [427, 585],
            [376, 585],
            [376, 336],
          ]}
          on={isOn(props.state, 'tiskipöytä_group')}
          onClick={() =>
            props.send(
              JSON.stringify({
                device: 'tiskipöytä_group',
                brightness: isOn(props.state, 'tiskipöytä_group') ? 0 : 254,
              }),
            )
          }
        />

        <Zone
          note="eteinen"
          path={[
            [274, 585],
            [510, 585],
            [510, 733],
            [460, 733],
            [460, 845],
            [274, 845],
            [274, 585],
          ]}
          on={isOn(props.state, 'eteinen_group')}
          onClick={() =>
            props.send(
              JSON.stringify({
                device: 'eteinen_group',
                brightness: isOn(props.state, 'eteinen_group') ? 0 : 254,
              }),
            )
          }
        />

        <Zone
          note="parveke"
          path={[
            [725, 348],
            [918, 314],
            [966, 560],
            [773, 594],
          ]}
          on={isOn(props.state, 'parveke_group')}
          onClick={() =>
            props.send(
              JSON.stringify({
                device: 'parveke_group',
                brightness: isOn(props.state, 'parveke_group') ? 0 : 254,
              }),
            )
          }
        />

        <Zone
          note="pikkuvessa"
          path={[
            [274, 685],
            [200, 685],
            [200, 845],
            [274, 845],
            [274, 685],
          ]}
          on={isOn(props.state, 'pikkuvessa_group')}
          onClick={() =>
            props.send(
              JSON.stringify({
                device: 'pikkuvessa_group',
                brightness: isOn(props.state, 'pikkuvessa_group') ? 0 : 254,
              }),
            )
          }
        />

        <Zone
          note="kylppäri"
          path={[
            [32, 482],
            [230, 482],
            [230, 585],
            [274, 585],
            [274, 685],
            [200, 685],
            [200, 720],
            [32, 720],
            [32, 482],
          ]}
          on={isOn(props.state, 'kylppäri_group')}
          onClick={() =>
            props.send(
              JSON.stringify({
                device: 'kylppäri_group',
                brightness: isOn(props.state, 'kylppäri_group') ? 0 : 254,
              }),
            )
          }
        />

        <Wall
          note="parveke"
          path={[
            [725, 348],
            [918, 314],
            [966, 560],
            [773, 594],
          ]}
          light
        />
        <Wall
          note="ulkoseinät"
          path={[
            [32, 27],
            [32, 845],
            [822, 845],
            [662, 27],
            [32, 27],
            [32, 845], // note: finishing with "Z" won't render correctly on Safari → draw one overlapping segment
          ]}
          dash={[
            1086, 70, 492, 94, 26, 50, 67, 139, 15, 55, 147, 160, 181, 50, 34,
            107, 85, 93, 18, 49,
          ]}
        />
        <Wall
          note="makkari"
          path={[
            [274, 27],
            [274, 335],
            [32, 335],
          ]}
          dash={[230, 55, 148, 55]}
        />
        <Wall
          note="käytävän vasen seinä"
          path={[
            [230, 335],
            [230, 585],
            [274, 585],
            [274, 845],
          ]}
          dash={[313, 55, 90, 55]}
        />
        <Wall
          note="vaatehuoneen vasen kotelo"
          path={[
            [32, 456],
            [69, 456],
            [69, 482],
            [32, 482],
            [32, 456],
          ]}
          filled
        />
        <Wall
          note="vaatehuoneen oikea kotelo"
          path={[
            [169, 482],
            [169, 455],
            [230, 455],
            [230, 482],
            [169, 482],
          ]}
          filled
        />
        <Wall
          note="kylppärin ja vaatehuoneen väliseinä"
          path={[
            [32, 482],
            [230, 482],
          ]}
          dash={[59, 55, 100]}
        />
        <Wall
          note="saunan väliseinä"
          path={[
            [32, 720],
            [200, 720],
          ]}
          dash={[90, 55]}
        />
        <Wall
          note="pikkuvessan seinä"
          path={[
            [274, 685],
            [200, 685],
            [200, 845],
          ]}
        />
        <Wall
          note="keittiön oikea seinä"
          path={[
            [376, 336],
            [427, 336],
            [427, 585],
            [376, 585],
          ]}
        />
        <Wall
          note="siivouskaapin ovi"
          path={[
            [510, 585],
            [510, 640],
          ]}
          light
        />
        <Wall
          note="Emman huoneen seinä 1"
          path={[
            [773, 594],
            [510, 640],
            [510, 733],
            [399, 733],
          ]}
          dash={[285, 55]}
        />
        <Wall
          note="Emman huoneen seinä 2"
          path={[
            [460, 733],
            [460, 845],
          ]}
        />
        <Wall
          note="siivouskaapin ulkoseinä"
          path={[
            [427, 585],
            [610, 585],
            [616, 621.5],
          ]}
          dash={[18, 55, 170]}
        />
        <Wall
          note="olohuoneen ja työhuoneen väliseinä"
          path={[
            [427, 365],
            [722, 333],
          ]}
          dash={[17, 55, 1000]}
        />

        <Icon
          name="Park"
          location={[465, 90]}
          on={isOn(props.state, 'joulukuusi_group')}
          onClick={() =>
            props.send(
              JSON.stringify({
                device: 'joulukuusi_group',
                brightness: isOn(props.state, 'joulukuusi_group') ? 0 : 254,
              }),
            )
          }
        />
      </svg>
    </div>
  )
}

function Wall(props: {
  note?: string
  path: [number, number][]
  dash?: number[]
  filled?: boolean
  light?: boolean
  highlight?: boolean
}) {
  const style: CSSProperties = {
    strokeWidth: 15,
    stroke: props.highlight ? 'red' : props.light ? 'lightgray' : 'black',
    fill: props.filled ? 'black' : 'transparent',
    strokeLinecap: 'butt', // TODO: Should probably be 'square' after all :sob:
    strokeLinejoin: 'miter',
    pointerEvents: 'none', // even though walls are rendered on top of other things, make them click-through
  }
  return props.dash ? (
    <>
      <path
        d={toPath(props.path)}
        style={{ ...style }}
        strokeDasharray={props.dash.join(' ')}
      />
      <path
        d={toPath(props.path)}
        style={{ ...style, stroke: 'lightgray' }}
        strokeDasharray={[0, ...props.dash, 0].join(' ')}
      />
    </>
  ) : (
    <path d={toPath(props.path)} style={style} />
  )
}

function Zone(props: {
  note?: string
  path: [number, number][]
  on?: boolean
  light?: boolean
  onClick?: () => void
}) {
  const style: CSSProperties = {
    strokeWidth: 1, // this ensures adjacent zones overlap, and the background will never shine through
    stroke: props.on ? '#e8d100' : 'transparent',
    fill: props.on ? '#e8d100' : 'transparent',
  }
  return <path d={toPath(props.path)} style={style} onClick={props.onClick} />
}

function toPath(path: [number, number][]) {
  return path.map((xy, i) => `${i === 0 ? 'M' : 'L'} ${xy.join(' ')}`).join(' ')
}

function isOn(state: LightGroups, groupFriendlyName: string) {
  const group = state.find(group => group.friendlyName === groupFriendlyName)
  if (!group) return false
  return !group.members.every(
    light => light.latestReceivedState?.state === 'OFF',
  )
}
