import { headers } from 'next/headers'
import { getSession } from '../../../../lib/session'

// Simulated user database
const users = [
  { username: 'user1', password: 'pass1' },
  { username: 'user2', password: 'pass2' },
]

// Function to validate user credentials
function validateCredentials(username: string, password: string): boolean {
  return users.some(user => user.username === username && user.password === password)
}

export async function POST(request: Request) {
  try {
    console.log(headers())
    const requestBody = await request.json()
    const { username, password }: { username: string, password: string } = requestBody
    
    if (!username || !password) {
      return new Response(JSON.stringify({ message: 'Username and password are required' }), { status: 400 })
    }

    if (!validateCredentials(username, password)) {
      return new Response(JSON.stringify({ message: 'Invalid username or password' }), { status: 401 })
    }

    const response = new Response(JSON.stringify({ message: 'Login successful' }), { status: 200 })
    const session: any = await getSession(request, response)
    session.user = username
    await session.save()

    return response
  } catch (error: unknown) {
    console.error((error as Error).message)
    return new Response(JSON.stringify({ message: (error as Error).message }), { status: 500 })
  }
}