import React, { useEffect, useRef, useState } from 'react'
import 'src/client/App.css'
import { PORT } from 'src/shared/config'
import { LightGroups } from 'src/server/state'

function App() {
  const [state, setState] = useState<LightGroups | undefined>()
  const socket = useRef<WebSocket | undefined>()
  useEffect(() => {
    socket.current = new WebSocket(`ws://${location.hostname}:${PORT}/`)
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

  console.log(state)

  return (
    <table>
      <tbody>
        {state?.flatMap(group =>
          group.members.map(light => (
            <tr
              key={light.friendlyName}
              style={{
                fontWeight:
                  light.latestReceivedState?.state === 'ON'
                    ? 'bold'
                    : 'initial',
              }}
            >
              <td>{group.friendlyName}</td>
              <td>{light.friendlyName}</td>
              <td>{light.latestReceivedState?.state}</td>
              <td>{light.latestReceivedState?.brightness}</td>
              <td>
                <button
                  onClick={() => {
                    socket.current?.send(
                      JSON.stringify({
                        device: light.friendlyName,
                        brightness: 254,
                      }),
                    )
                  }}
                >
                  ON
                </button>
              </td>
              <td>
                <button
                  onClick={() => {
                    socket.current?.send(
                      JSON.stringify({
                        device: light.friendlyName,
                        brightness: 0,
                      }),
                    )
                  }}
                >
                  OFF
                </button>
              </td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  )
}

export default App
