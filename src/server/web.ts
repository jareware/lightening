import express, { Request } from 'express'
import expressWs from 'express-ws'
import _ from 'lodash'
import path from 'path'
import { CommandModule } from 'src/server/command'
import { LightGroups } from 'src/server/state'
import { PromiseOf } from 'src/server/types'
import { PORT } from 'src/shared/config'
import { WebSocket } from 'ws'

export type WebServer = PromiseOf<ReturnType<typeof createWebServer>>
export async function createWebServer(command: CommandModule) {
  let prevLightGroups: LightGroups
  let connectedSockets: Array<WebSocket> = []

  startExpressServer()

  // Return public API:
  return {
    sendAppState,
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
    if (prevLightGroups) {
      ws.send(JSON.stringify(prevLightGroups)) // if we already have the latest state available, send it down immediately
    }
    ws.on('message', (msg: string) => {
      console.log('Got message from socket:', msg)
      const parsed = JSON.parse(msg)
      command.setNewLightStateIfNeeded(
        parsed.device,
        parsed.brightness,
        prevLightGroups,
      )
    })
    ws.on('close', () => {
      console.log('Connection closing')
      connectedSockets = connectedSockets.filter(socket => socket !== ws)
    })
  }

  function sendAppStateIfNeeded(lightGroups: LightGroups) {
    if (_.isEqual(prevLightGroups, lightGroups)) return
    sendAppState(lightGroups)
    prevLightGroups = lightGroups
  }

  function sendAppState(lightGroups: LightGroups) {
    connectedSockets.forEach(ws => ws.send(JSON.stringify(lightGroups)))
  }
}
