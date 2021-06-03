import { FC } from "react"
import Layout from "../../components/Layout"
import Title from "../../components/Title"
import TrackGrid from "../../components/track/TrackGrid"
import Track from "../../interfaces/Track"
import database, { serialize } from "../../lib/database"
import { getTracks } from "../../lib/spotify"
import authenticate from "../../middleware/authenticate"
import Tag, { ITag } from "../../models/Tag"

export const Home: FC<ITag<Track>> = ({ name, color, tracks }) => {
   return (
      <Layout>

         <Title>{name}</Title>

         <TrackGrid tracks={tracks} />

      </Layout>
   )
}

export const getServerSideProps = authenticate(async (session, req) => {
   await database()

   const tag = await Tag.findOne({
      slug: req.query.slug as string,
      user: session.user.id,
   }).then(t => serialize(t))

   if (!tag) return { notFound: true }
   
   const tracks = await getTracks(session, tag.tracks)

   return { props: { ...tag, tracks } }
})

export default Home
