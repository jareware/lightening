import express from 'express'
// var expressWs = require('express-ws')(app);
import ExpressWs from 'express-ws'
import path from 'path'
import { createApp } from 'src/server/app'
import { PORT } from 'src/shared/config'
// import { PORT } from '../shared/config'

// console.log({ createApp })

const lightening = createApp('tcp://192.168.1.3:1883')

// // TODO
// import { createApp } from 'src/server/app'
// createApp('tcp://192.168.1.3:1883').then(
//   app => ((global as any).app = app), // make app available as global for easier REPL startup
// )

const app = express()
// const expressWs = ExpressWs(app)

ExpressWs(app)

export const asd: any = {}

// var expressWs = require('express-ws')(app)
// expressWs
;(app as any).ws('/', function (ws: any, req: any) {
  console.log('GOT CNNNETION')
  asd.ws = ws
  ws.on('message', function (msg: any) {
    console.log('GOT MESSAGE FROM SOCKET', msg)
    // ws.send(msg)
  })
})

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
