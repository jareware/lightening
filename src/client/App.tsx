import React, { useEffect, useRef, useState } from 'react'
import 'src/client/App.css'
import { PORT } from 'src/shared/config'
import { LightGroups } from 'src/server/state'

function App() {
  const [state, setState] = useState<LightGroups | undefined>()
  const socket = useRef<WebSocket | undefined>()
  useEffect(() => {
    socket.current = new WebSocket(
      process.env.NODE_ENV === 'production'
        ? `ws://${location.hostname}:${location.port}/` // in prod, connect to whatever port the UI was served from
        : `ws://${location.hostname}:${PORT}/`, // in development, we can't connect through the CRA proxy, so connect directly to server process
    )
    socket.current.onopen = e => {
      // socket.current.send('My name is John')
    }

    socket.current.onmessage = function (event) {
      console.log(`[message] Data received from server: ${event.data}`)
      setState(JSON.parse(event.data))
    }

    socket.current.onclose = function (event) {
      if (event.wasClean) {
        console.log(
          `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`,
        )
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log('[close] Connection died')
      }
    }

    socket.current.onerror = function (error: any) {
      console.log(`[error] ${error.message}`)
    }

    return () => {
      console.log('Closing the socket because unmounting')
      socket.current?.close()
    }
  }, [])

  return (
    <>
      {state?.flatMap(group => {
        const isOff = group.members.every(
          light => light.latestReceivedState?.state === 'OFF',
        )
        const brightness = Math.round(
          (group.members
            .map(light => light.latestReceivedState?.brightness ?? 0)
            .reduce((memo, next) => memo + next, 0) /
            group.members.length /
            254) *
            100,
        )
        return (
          <div
            key={group.friendlyName}
            className={'light ' + (isOff ? 'off' : 'on')}
          >
            <label htmlFor={group.friendlyName}>{group.friendlyName}</label>
            <button
              id={group.friendlyName}
              onClick={() =>
                socket.current?.send(
                  JSON.stringify({
                    device: group.friendlyName,
                    brightness: isOff ? 254 : 0,
                  }),
                )
              }
            >
              {isOff ? 'OFF' : brightness + '%'}
            </button>
          </div>
        )
      })}
    </>
  )
}

export default App
