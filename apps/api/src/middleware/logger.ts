import type { Context, MiddlewareHandler } from 'hono'

/**
 * Structured request logging for Workers Logs.
 *
 * Workers Logs (enabled via `observability` in wrangler.jsonc) captures
 * `console.log` output. Emitting a single JSON object per request gives each
 * field its own filterable column in the dashboard (status, durationMs, …),
 * which a plain text line would not.
 *
 * A request id is derived from Cloudflare's `cf-ray` header (falling back to a
 * random uuid in `wrangler dev`, where there is no ray). It is echoed back as
 * `x-request-id` so a client can correlate a response with its server log line,
 * and stored on the Hono context (`c.get('requestId')`) for downstream use.
 */
export type LoggerVariables = {
  requestId: string
}

export const requestLogger: MiddlewareHandler<{
  Variables: LoggerVariables
}> = async (c, next) => {
  const requestId = c.req.header('cf-ray') ?? crypto.randomUUID()
  c.set('requestId', requestId)
  c.header('x-request-id', requestId)

  const start = Date.now()
  try {
    await next()
  } catch (err) {
    log(c, requestId, start, 500, err)
    throw err
  }
  log(c, requestId, start, c.res.status)
}

function log(c: Context, requestId: string, start: number, status: number, error?: unknown) {
  const entry = {
    requestId,
    method: c.req.method,
    path: c.req.path,
    status,
    durationMs: Date.now() - start,
    ...(error !== undefined && {
      error: error instanceof Error ? error.message : String(error),
    }),
  }
  if (status >= 500) {
    console.error(entry)
  } else {
    console.log(entry)
  }
}
