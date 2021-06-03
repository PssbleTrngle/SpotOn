import { useTheme } from '@emotion/react'
import styled from '@emotion/styled'
import Head from 'next/head'
import React, { FC, ReactNode } from 'react'
import useTooltip from './hooks/useTooltip'
import Nav from './Nav'

const Layout: FC<{
   children?: ReactNode
   title?: string
   image?: string
   description?: string
}> = ({ children, title = 'SpotOn', image = '/icon.png', description }) => {

   const { bg } = useTheme()
   const tooltip = useTooltip()

   return (
      <>
         {tooltip}
         <Head>
            <title>{title}</title>
            <meta charSet='utf-8' />
            <meta name='viewport' content='initial-scale=1.0, width=device-width' />

            <link rel='icon' href='/favicon.ico' />

            <meta name='theme-color' content={bg} />
            <meta name='description' content='SpotOn description' />
            <link rel='apple-touch-icon' href='/icon.png' />

            <meta property='og:type' content='website' />
            <meta property='og:title' content={title} />
            <meta property='og:image' content={image} />
            {description && <meta property='og:description' content={description} />}

            <link rel='manifest' href='/manifest.json' />
         </Head>

         <Container>
            <Nav />
            {Array.isArray(children)
               ? <div>{children}</div>
               : children
            }
         </Container>
      </>
   )
}

const Container = styled.div`
   display: grid;
   grid-template:
      "nav content"
      / 300px 1fr;

   & > div {
      padding: 1rem;
      overflow-x: hidden;
      overflow-y: scroll;
      height: 100vh;
   }
`

export default Layout
