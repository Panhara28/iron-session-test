'use server'
import { headers } from 'next/headers'
import { getServerActionSession } from './../../lib/session'
import crypto from 'crypto'
import { client } from '@/apollo'
import { gql } from '@apollo/client'
import { revalidatePath } from 'next/cache'

const MUTATION = gql`
  mutation UserLoginMutation($input: UserLoginInput) {
  userLoginMutation(input: $input) {
    user {
      id
      username
    }
    session {
      sessionToken
      sessionId
    }
  }
}
`

const QUERY = gql`
  query GetMeQuery($input: SessionInput) {
    getMeQuery(input: $input) {
      id
      username
    }
  }
`

// In a real application, use a database to store sessions
let sessions = new Map()

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
  const { username, password } = credentials
  const { data } = await client.mutate({
    mutation: MUTATION,
    variables: {
      input: {
        username,
        password
      }
    },
    fetchPolicy: "no-cache",
  });

  const { userLoginMutation } = data;

  const ip = getClientIp()

  if (userLoginMutation.user) {

    sessions.set(userLoginMutation.session.sessionId, {
      userId: userLoginMutation.user.id,
      username: userLoginMutation.user.username,
      sessionToken: userLoginMutation.session.sessionToken,
      ip,
      lastAccessed: Date.now(),
      created: Date.now()
    })

    const session: any = await getServerActionSession()
    session.sessionId = userLoginMutation.session.sessionId
    await session.save()
    revalidatePath("/");
    return { status: 200, sessionToken: `${userLoginMutation.session.sessionToken}`, }
  } else {
    return { status: 401, message: 'Invalid username or password' }
  }
}

export async function getUserInfoServerAction(sessionToken: string) {
  const session: any = await getServerActionSession()
  const sessionId = session.sessionId

  const { data: { getMeQuery } } = await client.query({
    query: QUERY,
    variables: {
      input: {
        sessionToken,
        sessionId
      }
    }
  });

  const ip = getClientIp()

  console.log('Get user info attempt:', { sessionId, ip })
  console.log("data", !sessionId || !sessions.has(sessionId))
  // if (!sessionId || !sessions.has(sessionId)) {
  //   return null
  // }

  const userSession = sessions.get(sessionId);
  // In development, don't validate IP
  const isLocalhost = ['::1', '127.0.0.1', 'localhost'].includes(ip)
  const ipValid = isLocalhost || userSession.ip === ip

  if (userSession?.sessionToken !== sessionToken || !ipValid || Date.now() - userSession?.created > 24 * 60 * 60 * 1000) {
    console.log('Session validation failed:', {
      tokenMatch: userSession.sessionToken === sessionToken,
      ipValid,
      sessionAge: (Date.now() - userSession.created) / 1000 / 60 / 60 + ' hours'
    })
    sessions.delete(sessionId)
    return null
  }

  if (Date.now() - userSession.lastAccessed > 15 * 60 * 1000) {
    userSession.sessionToken = sessionToken
    userSession.lastAccessed = Date.now()
    sessions.set(sessionId, userSession)
  }

  return { username: userSession.username, newSessionToken: userSession.sessionToken }
}

export async function logoutServerAction() {
  const session: any = await getServerActionSession()
  const sessionId = session.sessionId

  console.log('Logout attempt:', { sessionId })

  if (sessionId) {
    sessions.delete(sessionId)
  }

  session.destroy()
  return { status: 200, message: 'Logout successful' }
}