import NextAuth from 'next-auth'
import { JWT } from 'next-auth/jwt'
import Providers from 'next-auth/providers'

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, JWT_PRIVATE_KEY } = process.env

if (!SPOTIFY_CLIENT_ID) throw new Error('Please define the SPOTIFY_CLIENT_ID environment variable inside .env.local')
if (!SPOTIFY_CLIENT_SECRET) throw new Error('Please define the SPOTIFY_CLIENT_SECRET environment variable inside .env.local')
if (!JWT_PRIVATE_KEY) throw new Error('Please define the JWT_PRIVATE_KEY environment variable inside .env.local')

const scope = [
   'user-top-read',
   'user-read-recently-played',
   'playlist-modify-public',
   'playlist-modify-private',
   'playlist-read-private',
   'user-library-read',
   'user-read-email',
   'user-read-private',
]

export default NextAuth({
   theme: 'dark',
   providers: [
      Providers.Spotify({
         clientId: SPOTIFY_CLIENT_ID,
         clientSecret: SPOTIFY_CLIENT_SECRET,
         scope: scope.join(' '),
      })
   ],
   events: {
      error: async (message) => console.error(message),
   },
   jwt: {
      signingKey: JWT_PRIVATE_KEY,
   },
   callbacks: {
      async jwt(data, _user, account) {
         if (account) {
            data.id = account.id as string
            data.token = {
               accessToken: account.accessToken as string,
               refreshToken: account.refreshToken as string,
               expiresAt: new Date().getTime() + (account.expires_in ?? 0),
            }
         }
         return data
      },
      session(session, jwt: JWT) {
         const { id, token } = jwt
         return {
            ...session, user: {
               ...session.user,
               id, token,
            }
         }
      }
   }
})