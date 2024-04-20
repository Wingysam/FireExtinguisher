import { spawn } from 'child_process'
import { config as dotenv } from 'dotenv'

dotenv()

const trapFile = process.env.TRAP_FILE
if (!trapFile) {
  console.error('TRAP_FILE is not set')
  process.exit(1)
}
const webhook = process.env.WEBHOOK
const webhookMessage = process.env.WEBHOOK_MESSAGE

const inotifywait = spawn('inotifywait', ['-e', 'access', trapFile])
inotifywait.on('exit', async (code) => {
  if (code !== 0) {
    console.error('inotifywait exited with code', code)
    process.exit(1)
  }

  if (webhook) {
    const content = `${webhookMessage} ${trapFile} was accessed. Shutting the system down.`
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      })
    } catch {}
  }

  const shutdown = spawn('systemctl', ['poweroff', 'now'])
  shutdown.on('exit', (code) => {
    if (code !== 0) {
      console.error('shutdown exited with code', code)
      process.exit(1)
    }
    process.exit(0)
  })
})
