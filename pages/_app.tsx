import { Provider as AuthProvider } from 'next-auth/client'
import { AppComponent } from 'next/dist/next-server/lib/router/router'
import { darken } from 'polished'
import React from 'react'
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components'
import { MenuProvider } from '../components/hooks/useMenu'
import Nav from '../components/Nav'
import theme from '../lib/theme'
import '../style/reset.css'

const App: AppComponent = ({ Component, pageProps }) => {
   return (
      <AuthProvider session={pageProps.session}>
         <ThemeProvider theme={theme}>
            <MenuProvider>
               <GlobalStyles />

               <Container>
                  <Nav />
                  <Component {...pageProps} />
               </Container>
            </MenuProvider>
         </ThemeProvider>
      </AuthProvider>
   )
}

const Container = styled.div`
   display: grid;
   grid-template:
      'nav content'
      / 300px 1fr;

   & > div {
      overflow-x: hidden;
      overflow-y: scroll;
      height: 100vh;
      padding: 1rem;
   }
`

const GlobalStyles = createGlobalStyle`
   html, body {
      font-family: sans-serif;
      background: ${theme.bg};
      color: ${theme.text};
   }

   ul {
      list-style: none;
   }

   ::-webkit-scrollbar {
      width: auto;
   }

   ::-webkit-scrollbar-track {
      background: linear-gradient(
         transparent,
         ${darken(0.02, theme.bg)} 5%,
         ${darken(0.02, theme.bg)} 95%,
         transparent
      );
   }

   ::-webkit-scrollbar-thumb {
      background: ${darken(0.1, theme.bg)};
      border-radius: 6px;
   }

   ::-webkit-scrollbar-thumb:hover {
      background: ${darken(0.07, theme.bg)};
   }
`

export default App
