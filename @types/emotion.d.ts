import '@emotion/react';

declare module '@emotion/react' {
   interface Theme {
      bg: string
      primary: string
      secondary: string
      text: string
      error: string
      warning: string
      ok: string
      link: {
         default: string
         visited: string
      }
   }
}