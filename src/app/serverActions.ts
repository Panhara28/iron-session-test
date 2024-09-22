'use server'
import { headers } from 'next/headers'
import { getServerActionSession } from './../../lib/session'
import crypto from 'crypto'

const users = [
  { id: '1', username: 'user1', password: 'pass1' },
  { id: '2', username: 'user2', password: 'pass2' },
]

// In a real application, use a database to store sessions
let sessions = new Map()

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

function getClientIp() {
  const headersList = headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const remoteAddr = headersList.get('remote-addr')

  let clientIp = 'unknown'

  if (forwardedFor) {
    clientIp = forwardedFor.split(',')[0]
  } else if (realIp) {
    clientIp = realIp
  } else if (remoteAddr) {
    clientIp = remoteAddr
  }

  // Log all relevant information for debugging
  console.log('IP Detection:', {
    forwardedFor,
    realIp,
    remoteAddr,
    detectedIp: clientIp
  })

  return clientIp
}

export async function loginServerAction(credentials: { username: string, password: string }) {
  // const { username, password } = credentials
  // const user = users.find(u => u.username === username && u.password === password)
  // const ip = getClientIp()

  // console.log('Login attempt:', { username, ip })

  // if (user) {
  //   const sessionId = generateToken()
  //   const sessionToken = generateToken()
    
  //   sessions.set(sessionId, { 
  //     userId: user.id, 
  //     username: user.username,
  //     sessionToken,
  //     ip,
  //     lastAccessed: Date.now(),
  //     created: Date.now()
  //   })
    
  //   const session: any = await getServerActionSession()
  //   session.sessionId = sessionId
  //   await session.save()

  //   return { status: 200, message: 'Login successful', sessionToken }
  // } else {
  //   return { status: 401, message: 'Invalid username or password' }
  // }
}

export async function getUserInfoServerAction(sessionToken: string) {
  // const session: any = await getServerActionSession()
  // const sessionId = session.sessionId
  // const ip = getClientIp()

  // console.log('Get user info attempt:', { sessionId, ip })

  // if (!sessionId || !sessions.has(sessionId)) {
  //   return null
  // }

  // const userSession = sessions.get(sessionId)
  
  // // In development, don't validate IP
  // const isLocalhost = ['::1', '127.0.0.1', 'localhost'].includes(ip)
  // const ipValid = isLocalhost || userSession.ip === ip

  // if (userSession.sessionToken !== sessionToken || !ipValid || Date.now() - userSession.created > 24 * 60 * 60 * 1000) {
  //   console.log('Session validation failed:', { 
  //     tokenMatch: userSession.sessionToken === sessionToken,
  //     ipValid,
  //     sessionAge: (Date.now() - userSession.created) / 1000 / 60 / 60 + ' hours'
  //   })
  //   sessions.delete(sessionId)
  //   return null
  // }

  // if (Date.now() - userSession.lastAccessed > 15 * 60 * 1000) {
  //   userSession.sessionToken = generateToken()
  //   userSession.lastAccessed = Date.now()
  //   sessions.set(sessionId, userSession)
  // }

  // return { username: userSession.username, newSessionToken: userSession.sessionToken }
}

export async function logoutServerAction() {
  // const session: any  = await getServerActionSession()
  // const sessionId = session.sessionId

  // console.log('Logout attempt:', { sessionId })

  // if (sessionId) {
  //   sessions.delete(sessionId)
  // }

  // session.destroy()
  // return { status: 200, message: 'Logout successful' }
}