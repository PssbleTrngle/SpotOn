import { css, Global, ThemeProvider, useTheme } from '@emotion/react'
import styled from '@emotion/styled'
import { Provider as AuthProvider } from 'next-auth/client'
import { AppComponent } from 'next/dist/next-server/lib/router/router'
import React, { FC, useRef } from 'react'
import { MenuProvider } from '../components/hooks/useMenu'
import { ScrollProvider } from '../components/hooks/useScroll'
import Nav from '../components/Nav'
import theme from '../lib/theme'
import '../style/reset.css'

const App: AppComponent = ({ Component, pageProps }) => {
   const scrollRef = useRef<HTMLElement | null>(null)

   return (
      <AuthProvider session={pageProps.session}>
         <ThemeProvider theme={theme}>
            <MenuProvider>
               <ScrollProvider value={scrollRef}>
                  <Styles />

                  <Container >
                     <Nav />
                     <section ref={scrollRef}>
                        <Component {...pageProps} />
                     </section>
                  </Container>

               </ScrollProvider>
            </MenuProvider>
         </ThemeProvider>
      </AuthProvider>
   )
}

const Container = styled.div`
   display: grid;
   grid-template:
      "nav content"
      / 300px 1fr;

   & > section {
      overflow-x: hidden;
      overflow-y: scroll;
      height: 100vh;
      padding: 1rem;
   }
`

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
