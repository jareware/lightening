import React, { useEffect, useRef, useState } from 'react'
import 'src/client/App.css'
import { LightGroups } from 'src/server/state'
import { PORT } from 'src/shared/config'

const url =
  process.env.NODE_ENV === 'production'
    ? `ws://${location.hostname}:${location.port}/` // in prod, connect to whatever port the UI was served from
    : `ws://${location.hostname}:${PORT}/` // in development, we can't connect through the CRA proxy, so connect directly to server process

function App() {
  const { connected, state, send } = useServerConnection()

  if (!connected) return <pre>NOT CONNECTED</pre>

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
                send(
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

function useServerConnection() {
  const socket = useRef<
    ReturnType<typeof createRetryingWebSocket> | undefined
  >()
  const [connected, setConnected] = useState(false)
  const [state, setState] = useState<LightGroups | undefined>()

  useEffect(() => {
    socket.current = createRetryingWebSocket(
      url,
      data => {
        console.log('Received data from server:', data)
        setState(JSON.parse(data))
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

  return {
    send: (data: string) => socket.send(data),
    dispose: () => {
      timeout && clearTimeout(timeout)
      socket.dispose()
    },
  }

  function _onStatusChange(connected: boolean) {
    onStatusChange(connected)
    if (!connected) {
      socket.dispose()
      setTimeout(
        () => (socket = createWebSocket(url, onMessage, _onStatusChange)),
        5000,
      )
    }
  }
}
