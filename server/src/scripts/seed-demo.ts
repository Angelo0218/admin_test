import { seedDemoData } from '../models/seed'

async function run() {
  const result = await seedDemoData()
  console.warn('[seed:demo]', result)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
