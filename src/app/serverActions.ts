'use server'
import { headers } from 'next/headers'
import { getServerActionSession } from './../../lib/session'
import crypto from 'crypto'
import { client } from '@/apollo'
import { gql } from '@apollo/client'
import { revalidatePath } from 'next/cache'

const MUTATION = gql`
  mutation UserLoginMutation($input: UserLoginInput) {
  userLogin(input: $input) {
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
  query getMe($input: SessionInput) {
    getMe(input: $input) {
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

  const { userLogin } = data;

  const ip = getClientIp()

  if (userLogin.user) {

    sessions.set(userLogin.session.sessionId, {
      userId: userLogin.user.id,
      username: userLogin.user.username,
      sessionToken: userLogin.session.sessionToken,
      ip,
      lastAccessed: Date.now(),
      created: Date.now()
    })

    const session: any = await getServerActionSession()
    session.sessionId = userLogin.session.sessionId
    await session.save()
    revalidatePath("/");
    console.log("userLogin.session.sessionToken", userLogin.session.sessionToken)
    return { status: 200, sessionToken: `${userLogin.session.sessionToken}`, }
  } else {
    return { status: 401, message: 'Invalid username or password' }
  }
}

export async function getUserInfoServerAction(sessionToken: string) {
  //ទាក់ទងនឹង Server 
  const session: any = await getServerActionSession()
  const sessionId = session.sessionId
  const ip = getClientIp()

  const userSession = sessions.get(sessionId);
  // In development, don't validate IP
  const isLocalhost = ['::1', '127.0.0.1', 'localhost'].includes(ip)
  const ipValid = isLocalhost || userSession.ip === ip

  if (userSession?.sessionToken !== sessionToken || !ipValid || Date.now() - userSession?.created > 24 * 60 * 60 * 1000) {
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

  if (sessionId) {
    sessions.delete(sessionId)
  }

  session.destroy()
  return { status: 200, message: 'Logout successful' }
}