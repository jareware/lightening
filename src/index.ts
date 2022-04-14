import { createApp } from 'src/app'

createApp('tcp://192.168.1.3:1883').then(
  app => ((global as any).app = app), // make app available as global for easier REPL startup
)
