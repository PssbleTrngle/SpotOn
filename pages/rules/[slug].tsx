import { FC } from "react"
import Layout from "../../components/Layout"
import RuleView from "../../components/RuleView"
import Title from "../../components/Title"
import TrackGrid from "../../components/track/TrackGrid"
import Track from "../../interfaces/Track"
import database, { serialize } from "../../lib/database"
import { getSavedTracks } from "../../lib/spotify"
import authenticate from "../../middleware/authenticate"
import Rule, { IRule } from "../../models/Rule"

export const Home: FC<IRule & {
   tracks: Track[]
}> = ({ tracks, ...rule }) => {
   return (
      <Layout>

         <Title>{rule.name}</Title>

         <RuleView {...rule} />

         <TrackGrid tracks={tracks} />

      </Layout>
   )
}

export const getServerSideProps = authenticate(async (session, req) => {
   await database()

   const existing = await Rule.findOne({
      slug: req.query.slug as string,
      user: session.user.id,
   })

   const rule = existing ?? await Rule.create({
      user: session.user.id,
      name: req.query.slug,
      type: 'Or',
      children: [{
         type: 'HasTag',
         value: '60ad4a660f422e66f0a5bf4f',
      }, {
         type: 'HasTag',
         value: '60ad4a660f422e66f0a5bf50',
      }],
   })

   const { items } = await getSavedTracks(session)
   const tracks = items.filter(t => rule.test(t.track)).map(t => t.track)

   if (!rule) return { notFound: true }

   return { props: { ...serialize(rule), tracks } }
})

export default Home
