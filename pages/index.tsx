import { FC } from 'react'
import Layout from '../components/Layout'
import Title from '../components/Title'
import TrackList from '../components/track/TrackList'
import { SavedTrack } from '../interfaces/Track'
import database, { serialize } from '../lib/database'
import { getSavedTracks } from '../lib/spotify'
import authenticate from '../middleware/authenticate'
import Tag, { ITag } from '../models/Tag'

export const Home: FC<{
  tracks: SavedTrack[]
  tags: ITag[]
}> = ({ tracks, tags }) => {
  return (
    <Layout>

      <Title>Saved Tracks</Title>

      <TrackList tags={tags} tracks={tracks} />

    </Layout>
  )
}

export const getServerSideProps = authenticate(async session => {
  await database()

  const [tracks, tags] = await Promise.all([
    getSavedTracks(session, { limit: 50 }).then(t => t.items),
    Tag.find({ user: session.user.id }).then(serialize),
  ])

  return { props: { tracks, tags } }
})

export default Home
