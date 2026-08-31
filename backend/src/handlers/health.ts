import { json } from '../http.js'
import type { RouteHandler } from '../router.js'

export const health: RouteHandler = async () => {
  return json(200, {
    status: 'ok',
    service: 'cap-api',
    timestamp: new Date().toISOString(),
  })
}