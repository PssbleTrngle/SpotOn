import styled from '@emotion/styled'
import { Plus, Sync } from '@styled-icons/fa-solid'
import { FC } from 'react'
import Button from '../../components/Button'
import useSubmit from '../../components/hooks/useSubmit'
import Layout from '../../components/Layout'
import RuleView from '../../components/RuleView'
import Title from '../../components/Title'
import TrackGrid from '../../components/track/TrackGrid'
import Track from '../../interfaces/Track'
import database, { serialize } from '../../lib/database'
import authenticate from '../../middleware/authenticate'
import Rule, { IRule } from '../../models/Rule'

export const Home: FC<
   IRule & {
      tracks: Track[]
   }
> = ({ tracks, playlist, ...rule }) => {
   const [sync] = useSubmit(`rule/${rule.id}/sync`)

   return (
      <Layout>
         <Grid>
            <Title>{rule.name}</Title>

            <RuleView {...rule} />

            <ul>
               <Button onClick={sync}>{playlist ? <Sync size='1rem' /> : <Plus size='1rem' />}</Button>
            </ul>

            <TrackGrid tracks={tracks} />
         </Grid>
      </Layout>
   )
}

const Grid = styled.div`
   display: grid;

   row-gap: 100px;

   grid-template:
      'title rule buttons' auto
      'tracks tracks tracks' 1fr;
`

export const getServerSideProps = authenticate(async (session, req) => {
   await database()

   const rule = await Rule.findOne({
      slug: req.query.slug as string,
      user: session.user.id,
   })

   if (!rule) return { notFound: true }

   const tracks = await rule.tracks(session)

   return { props: { ...serialize(rule), tracks } }
})

export default Home
