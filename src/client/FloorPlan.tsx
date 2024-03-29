import React, { CSSProperties, Fragment, useEffect, useState } from 'react'
import 'src/client/App.css'
import { Icon } from 'src/client/Icon'
import config from 'src/shared/config'
import { Device } from 'src/shared/utils/config'
import { getDeviceState, StateMap } from '../shared/utils/state'

export function FloorPlan(props: {
  state: StateMap
  send: (data: string) => void | undefined
}) {
  const stateMissing = Object.values(config).filter(
    device => !props.state[device.name],
  )
  return (
    <div>
      <pre style={{ textAlign: 'center', overflow: 'hidden' }}>
        {stateMissing.length
          ? `⚠️ State still missing for: ${stateMissing.map(d => d.name)}`
          : ' '}
      </pre>
      <svg
        version="1.1"
        baseProfile="full"
        viewBox="0 0 860 880" // note: full view is "0 0 1000 880"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxHeight: '80vh' }}
      >
        {Object.values(config).map(device => (
          <Zones
            key={device.name}
            device={device}
            state={props.state}
            send={props.send}
          />
        ))}

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

        {Object.values(config).map(device => (
          <Widget
            key={device.name}
            device={device}
            state={props.state}
            send={props.send}
          />
        ))}

        {Object.values(config).map(
          (device, i) =>
            'zones' in device &&
            'debug' in device &&
            device.debug &&
            device.zones?.map((zone, j) => (
              <Fragment key={String([i, j])}>
                <path
                  d={toPath(zone)}
                  stroke="hotpink"
                  strokeWidth={3}
                  fill="transparent"
                />
                {zone.map(([x, y], k) => (
                  <circle cx={x} cy={y} r={5} fill="hotpink" />
                ))}
              </Fragment>
            )),
        )}
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

function Zones(props: {
  device: Device
  state: StateMap
  send: (data: string) => void
}) {
  if (!('zones' in props.device) || !props.device.zones) return null
  const state = props.state[props.device.name]
  if (!state) return null
  const on = 'powerOn' in state ? state.powerOn : state.brightness > 0
  const style: CSSProperties = {
    strokeWidth: 1, // this ensures adjacent zones overlap, and the background will never shine through
    stroke: on ? '#e8d100' : 'transparent',
    fill: on ? '#e8d100' : 'transparent',
  }
  return (
    <>
      {props.device.zones.map((zone, i) => (
        <path
          key={i}
          d={toPath(zone)}
          style={style}
          onClick={() =>
            props.send(
              JSON.stringify({
                device: props.device.name,
                brightness: on ? 0 : 254,
              }),
            )
          }
        />
      ))}
    </>
  )
}

function Widget(props: {
  device: Device
  state: StateMap
  send: (data: string) => void
}) {
  const [remaining, setRemaining] = useState(0)
  useEffect(() => {
    update()
    const int = setInterval(update, 250)
    return () => clearInterval(int)
    function update() {
      const state = getDeviceState(props.state, props.device.name)
      if (
        'turnOffAfterMinutes' in props.device &&
        props.device.turnOffAfterMinutes &&
        state &&
        'lastSetOnAt' in state &&
        state.lastSetOnAt &&
        state.brightness
      ) {
        const { lastSetOnAt } = state
        const { turnOffAfterMinutes } = props.device
        const remainingMillis =
          new Date(lastSetOnAt).getTime() +
          turnOffAfterMinutes * 60 * 1000 -
          Date.now()
        setRemaining(
          Math.max(0, remainingMillis / (turnOffAfterMinutes * 60 * 1000)),
        )
      } else {
        setRemaining(0)
      }
    }
  }, [props.device, props.state])
  if (!('location' in props.device) || !props.device.location) return null
  const state = props.state[props.device.name]
  if (!state) return null
  const on =
    'powerOn' in state
      ? state.powerOn
      : 'brightness' in state
        ? state.brightness > 0
        : 'motionDetected' in state
          ? state.motionDetected
          : 'doorOpen' in state
            ? state.doorOpen
            : false
  return (
    <Icon
      name={props.device.icon ?? 'Help'}
      location={props.device.location}
      on={on}
      remaining={remaining}
      onClick={() => {
        if (props.device.type === 'DoorSensor') {
          if ('lastChangedAt' in state && state.lastChangedAt) {
            alert(
              `Door was last ${on ? 'opened' : 'closed'} ${new Date(
                state.lastChangedAt,
              ).toLocaleTimeString()}`,
            )
          } else {
            alert(`Door hasn't updated since app start`)
          }
        } else {
          // Assume it's light-like
          props.send(
            JSON.stringify({
              device: props.device.name,
              brightness: on ? 0 : 254,
            }),
          )
        }
      }}
    />
  )
}

function toPath(path: [number, number][]) {
  return path.map((xy, i) => `${i === 0 ? 'M' : 'L'} ${xy.join(' ')}`).join(' ')
}
