import React, { useEffect, useState } from 'react'
import 'src/client/App.css'
import logo from 'src/client/logo.svg'
import { PORT } from 'src/shared/config'

function App() {
  const [state, setState] = useState<unknown>()
  useEffect(() => {
    // const addr =
    //   process.env.NODE_ENV === 'production'
    //     ? 'ws://' + location.hostname + ':3001/'
    //     : 'ws://' + location.hostname + ':3001/'
    const socket = new WebSocket(`ws://${location.hostname}:${PORT}/`)
    // var socket = new WebSocket("ws://" + location.host + "/whatever");

    // socket.send("Here's some text that the server is urgently awaiting!")
    socket.onopen = function (e) {
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

  return <pre>{JSON.stringify(state, null, 2)}</pre>
}

export default App
