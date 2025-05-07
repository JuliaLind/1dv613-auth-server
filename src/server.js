/**
 * The starting point of the application.
 *
 * @author Julia Lind
 * @version 1.0.0
 */

import fs from 'fs/promises'
import { connectDB } from './config/mongoose.js'
import { createApp } from './config/create-app.js'

// to be exported for testing purposes
let app, connection, server

try {
  // Connect to MongoDB.
  connection = await connectDB(process.env.DB_CONNECTION_STRING)
  // process.env.ACCESS_TOKEN_PRIVATE_KEY = await fs.readFile(process.env.ACCESS_TOKEN_PRIVATE_KEY_PATH, 'utf-8')
  process.env.ACCESS_TOKEN_PRIVATE_KEY = (await fs.readFile(
    process.env.ACCESS_TOKEN_PRIVATE_KEY_PATH,
    'utf-8'
  )).replace(/\r/g, '')

  app = createApp()

  // Starts the HTTP server listening for connections.
  server = app.listen(process.env.PORT, '0.0.0.0',() => {
    const address = server.address()
    const host = address.address === '::' ? 'localhost' : address.address
    const port = address.port

    console.log(`Server running at http://${host}:${port}`)
    console.log('Press Ctrl-C to terminate...')
  })
} catch (err) {
  console.error(err)
  process.exitCode = 1
}

export { app, connection, server }
