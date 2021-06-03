import { FC } from "react"
import Layout from "../../components/Layout"
import TagLabel from "../../components/TagLabel"
import Title from "../../components/Title"
import TrackGrid from "../../components/track/TrackGrid"
import Track from "../../interfaces/Track"
import database, { serialize } from "../../lib/database"
import { getTracks } from "../../lib/spotify"
import authenticate from "../../middleware/authenticate"
import Tag, { ITag } from "../../models/Tag"

export const Home: FC<ITag<Track>> = tag => {
   const { tracks } = tag

   return (
      <Layout>

         <Title>
            <TagLabel size={2} {...tag} />
         </Title>

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
