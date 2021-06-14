import { Check, Plus, Sync } from '@styled-icons/fa-solid'
import { darken } from 'polished'
import { FC } from 'react'
import styled, { useTheme } from 'styled-components'
import Button from '../../components/Button'
import useSubmit from '../../components/hooks/useSubmit'
import useTooltip from '../../components/hooks/useTooltip'
import Label from '../../components/Label'
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
   const tooltip = useTooltip('buttons')
   const { bg } = useTheme()

   return (
      <Layout>
         <Grid>
            <Title>{rule.name}</Title>

            <RuleView {...rule} />

            <Buttons>
               {tooltip}

               {playlist ? (
                  <>
                     <Label size={1} color={darken(0.1, bg)} data-for='buttons' data-tip='Open in spotify' target='_blank' href={`https://open.spotify.com/user/1185903410/playlist/${playlist}`}>
                        <span>Linked</span>
                        <Check size='1rem' />
                     </Label>

                     <Button data-for='buttons' data-tip='Sync with Playlist' onClick={sync}>
                        <Sync size='1rem' />
                     </Button>
                  </>
               ) : (
                  <>
                     <Button data-for='buttons' data-tip='Create synced Playlist' onClick={sync}>
                        <Plus size='1rem' />
                     </Button>
                  </>
               )}
            </Buttons>

            <TrackGrid tracks={tracks} />
         </Grid>
      </Layout>
   )
}

const Buttons = styled.ul`
   grid-area: buttons;
   display: grid;
   grid-auto-flow: column;
   gap: 10px;
   justify-content: start;
`

const Grid = styled.div`
   display: grid;

   row-gap: 100px;

   grid-template:
      'title rule' auto
      'buttons buttons'
      'tracks tracks' 1fr;
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
