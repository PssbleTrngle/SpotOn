import axios from 'axios'
import NextAuth from 'next-auth'
import { JWT } from 'next-auth/jwt'
import Providers from 'next-auth/providers'
import { stringify } from 'querystring'
import { AdditionalJWT } from '../../../@types/jwt'

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
const base64 = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')

interface TokenResponse {
   access_token: string
   expires_in: number
}

async function refresh(token: AdditionalJWT['token']): Promise<AdditionalJWT['token']> {
   const { data } = await axios.post<TokenResponse>('https://accounts.spotify.com/api/token', stringify({
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
   }), {
      headers: {
         Authorization: `Basic ${base64}`
      }
   })

   return {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      refreshToken: token.refreshToken,
   }
}

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
      async jwt(data, user, account) {

         if (account && user) {
            data.id = account.id as string
            data.token = {
               accessToken: account.accessToken as string,
               refreshToken: account.refreshToken as string,
               expiresAt: Date.now() + (account.expires_in ?? 0) * 1000,
            }
         }

         if (Date.now() >= data.token.expiresAt) {
            console.log('Refreshing token')
            return {
               ...data, token: await refresh(data.token)
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