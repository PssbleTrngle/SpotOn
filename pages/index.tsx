import styled from '@emotion/styled'
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
}> = ({ tags }) => {

  return (
    <Layout>
      <Style>

        <Title>Saved Tracks</Title>

        <TrackList tags={tags} endpoint='/api/saved' />

      </Style>
    </Layout>
  )
}

export const getServerSideProps = authenticate(async session => {
  await database()

  const [tracks, tags] = await Promise.all([
    getSavedTracks(session, { limit: 10 }).then(l => l.items),
    Tag.find({ user: session.user.id }).then(serialize),
  ])

  return { props: { tracks, tags } }
})


const Style = styled.div`
  display: grid;
  grid-template: 
    "title" 100px
    "tracks" 700px;
`

export default Home
