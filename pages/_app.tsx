import { css, Global, ThemeProvider, useTheme } from '@emotion/react'
import { Provider as AuthProvider } from 'next-auth/client'
import { AppComponent } from 'next/dist/next-server/lib/router/router'
import React, { FC } from 'react'
import { MenuProvider } from '../components/hooks/useMenu'
import theme from '../lib/theme'
import '../style/reset.css'

const App: AppComponent = ({ Component, pageProps }) => {
   return (
      <AuthProvider session={pageProps.session}>
         <ThemeProvider theme={theme}>
            <MenuProvider>
               <Styles />
               <Component {...pageProps} />
            </MenuProvider>
         </ThemeProvider>
      </AuthProvider>
   )
}

const Styles: FC = () => {
   const { bg, text } = useTheme()
   return (
      <Global
         styles={css`
            body {
               font-family: sans-serif;
               background: ${bg};
               color: ${text};
            }

            ul {
               list-style: none;
            }

            ${scrollbar}
      `} />
   )
}

const scrollbar = css`
   ::-webkit-scrollbar {
      width: auto;
   }

   ::-webkit-scrollbar-track {
      background: #3e4247;
   }

   ::-webkit-scrollbar-thumb {
      background: #333438;
      border-radius: 6px;
   }

   ::-webkit-scrollbar-thumb:hover {
      background: #27292c;
   }
`

export default App
