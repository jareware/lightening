import React, { useEffect, useState } from 'react'
import 'src/client/App.css'
import logo from 'src/client/logo.svg'
import { PORT } from 'src/shared/config'
import { LightGroups } from 'src/server/state'

function App() {
  const [state, setState] = useState<LightGroups | undefined>()
  useEffect(() => {
    const socket = new WebSocket(`ws://${location.hostname}:${PORT}/`)
    socket.onopen = e => {
      // socket.send('My name is John')
    }

    socket.onmessage = function (event) {
      console.log(`[message] Data received from server: ${event.data}`)
      setState(JSON.parse(event.data))
    }

    socket.onclose = function (event) {
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

    socket.onerror = function (error: any) {
      console.log(`[error] ${error.message}`)
    }

    return () => {
      console.log('Closing the socket because unmounting')
      socket.close()
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
            </tr>
          )),
        )}
      </tbody>
    </table>
  )
}

export default App
