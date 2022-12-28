import express, { Request } from 'express'
import expressWs from 'express-ws'
import _ from 'lodash'
import path from 'path'
import { CommandModule } from 'src/server/command'
import { PromiseOf } from 'src/server/types'
import config, { PORT } from 'src/shared/config'
import { DeviceName } from 'src/shared/utils/config'
import { StateMap } from 'src/shared/utils/state'
import { WebSocket } from 'ws'

export type WebServer = PromiseOf<ReturnType<typeof createWebServer>>
export async function createWebServer(command: CommandModule) {
  let prevState: StateMap
  let connectedSockets: Array<WebSocket> = []

  startExpressServer()

  // Return public API:
  return {
    sendAppStateIfNeeded,
  }

  function startExpressServer() {
    const { app } = expressWs(express())

    app.ws('/', handleIncomingConnection)

    if (process.env.NODE_ENV === 'production') {
      // These are only relevant when in production we serve the static files from the server process
      const buildDir = path.join(__dirname, 'client-build')
      app.use(express.static(buildDir))
      app.get('/*', function (req, res) {
        res.sendFile(path.join(buildDir, 'index.html'))
      })
    }

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`)
    })
  }

  function handleIncomingConnection(ws: WebSocket, _req: Request) {
    connectedSockets.push(ws)
    if (prevState) {
      ws.send(JSON.stringify(prevState)) // if we already have the latest state available, send it down immediately
    }
    ws.on('message', (msg: string) => {
      try {
        console.log('Got command from UI:', msg)
        const parsed = JSON.parse(msg)
        const device = config[parsed.device as DeviceName]
        if (!device) {
          console.log(`Got unknown device "${parsed.device}" from client`)
        } else if (device.type === 'Light') {
          command.setLightState(device, parsed.brightness)
        } else if (device.type === 'PowerPlug') {
          command.setPowerState(device, parsed.brightness > 0)
        } else {
          console.log(`Incompatible command for device "${device.name}"`)
        }
      } catch (err) {
        console.log('Received malformed data from client')
      }
    })
    ws.on('close', () => {
      console.log('Connection closing')
      connectedSockets = connectedSockets.filter(socket => socket !== ws)
    })
  }

  function sendAppStateIfNeeded(newState: StateMap) {
    if (_.isEqual(prevState, newState)) return
    sendAppState(newState)
    prevState = newState
  }

  function sendAppState(newState: StateMap) {
    connectedSockets.forEach(ws => ws.send(JSON.stringify(newState)))
  }
}
