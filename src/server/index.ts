// var expressWs = require('express-ws')(app);
import { createApp } from 'src/server/app'
// import { PORT } from '../shared/config'

// console.log({ createApp })

// const lightening = createApp('tcp://192.168.1.3:1883')

// // TODO
// import { createApp } from 'src/server/app'

createApp('tcp://192.168.1.3:1883').then(
  app => ((global as any).app = app), // make app available as global for easier REPL startup
)
