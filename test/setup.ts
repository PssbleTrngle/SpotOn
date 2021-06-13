import { config } from 'dotenv'
import { Session } from 'next-auth'
import client from 'next-auth/client'

config({ path: '.env.test.local' })

const fakeSession: Session = {
   user: {
      id: 'tester',
      token: {
         accessToken: '',
         refreshToken: '',
         expiresAt: Date.now() + 1000 * 3600,
      },
   },
}

jest.mock('next-auth/client')

const getSession = client.getSession as jest.Mock
getSession.mockResolvedValue(fakeSession)
