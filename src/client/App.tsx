import React, { useEffect, useRef, useState } from 'react'
import 'src/client/App.css'
import { FloorPlan } from 'src/client/FloorPlan'
import { PORT } from 'src/shared/config'
import { StateMap } from '../shared/utils/state'

const url =
  process.env.NODE_ENV === 'production'
    ? `ws://${location.hostname}:${location.port}/` // in prod, connect to whatever port the UI was served from
    : `ws://${location.hostname}:${PORT}/` // in development, we can't connect through the CRA proxy, so connect directly to server process

function App() {
  const { connected, state, send } = useServerConnection()

  if (!connected) return <pre>NOT CONNECTED</pre>
  if (!state) return <pre>NO DATA</pre>

  return <FloorPlan state={state} send={send} />
}

export default App

function useServerConnection() {
  const socket = useRef<
    ReturnType<typeof createRetryingWebSocket> | undefined
  >()
  const [connected, setConnected] = useState(false)
  const [state, setState] = useState<StateMap | undefined>()

  useEffect(() => {
    socket.current = createRetryingWebSocket(
      url,
      raw => {
        const data = JSON.parse(raw)
        console.log('Received data from server', { data })
        setState(data)
      },
      setConnected,
    )
    return socket.current.dispose
  }, [])

  return {
    connected,
    state,
    send: (data: string) => socket.current?.send(data),
  }
}

function createWebSocket(
  url: string,
  onMessage: (data: string) => void,
  onStatusChange: (connected: boolean) => void,
) {
  console.log('WebSocket connecting')
  const socket = new WebSocket(url)
  let disposed = false

  socket.addEventListener('message', e => !disposed && onMessage(e.data))
  socket.addEventListener('open', () => !disposed && onStatusChange(true))
  socket.addEventListener('close', () => !disposed && onStatusChange(false))
  socket.addEventListener('error', () => !disposed && onStatusChange(false))

  return {
    send: (data: string) => socket.send(data),
    dispose: () => {
      console.log('WebSocket disposing')
      disposed = true
      socket.close()
    },
  }
}

function createRetryingWebSocket(
  url: string,
  onMessage: (data: string) => void,
  onStatusChange: (connected: boolean) => void,
) {
  let socket = createWebSocket(url, onMessage, _onStatusChange)
  let timeout: NodeJS.Timeout | undefined
  let backoff = 0

  return {
    send: (data: string) => socket.send(data),
    dispose: () => {
      timeout && clearTimeout(timeout)
      socket.dispose()
    },
  }

  function _onStatusChange(connected: boolean) {
    onStatusChange(connected)
    if (connected) {
      backoff = 0
    } else {
      socket.dispose()
      setTimeout(
        () => (socket = createWebSocket(url, onMessage, _onStatusChange)),
        backoff,
      )
      backoff = Math.min(backoff + 1000, 5000)
    }
  }
}
