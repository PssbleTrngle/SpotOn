import 'next-auth/jwt';

interface AdditionalJWT {
   id: string
   token: {
      accessToken: string
      refreshToken: string
      expiresAt: number
   }
}

declare module 'next-auth/jwt' {

   // eslint-disable-next-line @typescript-eslint/no-empty-interface
   export interface JWT extends AdditionalJWT { }

}

declare module 'next-auth' {

   export interface Session {
      user: AdditionalJWT
   }

}