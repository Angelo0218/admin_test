function formatError(err) {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack }
  }
  return { message: String(err) }
}

export function logError(err, meta = {}) {
  const payload = {
    level: 'error',
    time: new Date().toISOString(),
    ...meta,
    ...formatError(err),
  }
  console.error(JSON.stringify(payload))
}
