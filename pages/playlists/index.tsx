import { FC } from 'react'
import styled from 'styled-components'
import Grid from '../../components/Grid'
import Image from '../../components/Image'
import Layout from '../../components/Layout'
import Link from '../../components/Link'
import Title from '../../components/Title'
import Playlist from '../../interfaces/Playlist'
import database from '../../lib/database'
import { getPlaylists } from '../../lib/spotify'
import authenticate from '../../middleware/authenticate'

export const Home: FC<{ playlists: Playlist[] }> = ({ playlists }) => {
   return (
      <Layout>
         <Title>Playlists</Title>

         <Grid>
            {playlists.map(playlist => (
               <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
                  <Panel>
                     <Image src={playlist.images[0]?.url} />
                     <h3>{playlist.name}</h3>
                  </Panel>
               </Link>
            ))}
         </Grid>
      </Layout>
   )
}

const Panel = styled.li`
   margin-bottom: 1rem;
   cursor: pointer;

   h3 {
      padding: 0.5rem;
   }
`

export const getServerSideProps = authenticate(async session => {
   await database()

   const playlists = await getPlaylists(session).then(a => a.items)

   return { props: { playlists } }
})

export default Home
