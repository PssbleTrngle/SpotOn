import styled from "@emotion/styled"
import { FC } from "react"
import Layout from "../../components/Layout"
import RuleView from "../../components/RuleView"
import Title from "../../components/Title"
import TrackGrid from "../../components/track/TrackGrid"
import Track from "../../interfaces/Track"
import database, { serialize } from "../../lib/database"
import authenticate from "../../middleware/authenticate"
import Rule, { IRule } from "../../models/Rule"

export const Home: FC<IRule & {
   tracks: Track[]
}> = ({ tracks, ...rule }) => {
   return (
      <Layout>
         <Grid>

            <Title>{rule.name}</Title>

            <RuleView {...rule} />

            <TrackGrid tracks={tracks} />

         </Grid>
      </Layout>
   )
}

const Grid = styled.div`
   display: grid;

   ul {
      margin-top: 100px;
      grid-area: tracks;
   }
   
   grid-template: 
      "title rule" auto
      "tracks tracks" 1fr;
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
