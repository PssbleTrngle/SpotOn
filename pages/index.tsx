import { FC, useCallback, useMemo } from 'react'
import { useSWRInfinite } from 'swr'
import Button from '../components/Button'
import useScroll from '../components/hooks/useScroll'
import Layout from '../components/Layout'
import Title from '../components/Title'
import TrackList from '../components/track/TrackList'
import List from '../interfaces/List'
import { SavedTrack } from '../interfaces/Track'
import database, { serialize } from '../lib/database'
import { getSavedTracks } from '../lib/spotify'
import authenticate from '../middleware/authenticate'
import Tag, { ITag } from '../models/Tag'

const PER_SCROLL = 10

export const Home: FC<{
  tracks: SavedTrack[]
  tags: ITag[]
}> = ({ tags, ...props }) => {

  const { data, setSize, revalidate } = useSWRInfinite<List<SavedTrack>>(
    (_, previous) => {
      if(previous && !previous.next) return null
      const offset = previous ? (previous.offset + previous.items.length) : 0
      return `/api/saved?offset=${offset + props.tracks.length}&limit=${PER_SCROLL}`
    }
  )

  const loadNext = useCallback(() => setSize(i => i + 1), [setSize])
  useScroll(loadNext, { space: 0.6 })

  const tracks = useMemo(() => [...props.tracks, ...data?.map(it => it.items).flat() ?? []], [data, props.tracks])
  const hasNext = useMemo(() => !!data?.[data.length - 1].next, [data])

  return (
    <Layout>

      <Title>Saved Tracks</Title>

      <TrackList tags={tags} tracks={tracks ?? []} onChange={revalidate} />

      {hasNext && <Button onClick={loadNext}>Load More</Button>}

    </Layout>
  )
}

export const getServerSideProps = authenticate(async session => {
  await database()

  const [tracks, tags] = await Promise.all([
    getSavedTracks(session, { limit: 10 }).then(l => l.items),
    Tag.find({ user: session.user.id }).then(serialize),
  ])

  return { props: { tracks: [], tags } }
})

export default Home
