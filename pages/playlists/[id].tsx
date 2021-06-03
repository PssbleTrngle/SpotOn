import styled from "@emotion/styled"
import { FC } from "react"
import Button from "../../components/Button"
import useSubmit from "../../components/hooks/useSubmit"
import Layout from "../../components/Layout"
import RuleView from "../../components/RuleView"
import Title from "../../components/Title"
import TrackGrid from "../../components/track/TrackGrid"
import { ExtendedPlaylist } from "../../interfaces/Playlist"
import database, { serialize } from "../../lib/database"
import { getPlaylist } from "../../lib/spotify"
import authenticate from "../../middleware/authenticate"
import Rule from "../../models/Rule"
import Tag, { ITag } from "../../models/Tag"

export const Home: FC<ExtendedPlaylist & {
   imported?: ITag
}> = ({ name, tracks, rule, id, images, imported }) => {

   const [importAsTag, error] = useSubmit('tag/import', { playlist: id })

   return (
      <Layout>
         <Grid>

            <Title>{name}</Title>

            <Cover src={images[0]?.url} />

            <Buttons>
               {error && <p>{error.message}</p>}
               <Button disabled={!!imported} onClick={importAsTag}>
                  <span data-tip={imported ? `Already imported as ${imported.name}` : 'Create tag from playlist'}>Import</span>
               </Button>

            </Buttons>

            {rule && <RuleView {...rule} />}

            <TrackGrid tracks={tracks.items.map(t => t.track)} />

         </Grid>
      </Layout>
   )
}

const Grid = styled.div`
   h1 {
      font-size: 5rem;
   }

   ul {
      margin-top: 100px;
      grid-area: tracks;
   }

   display: grid;
   align-items: center;
   
   grid-template: 
      "name cover"
      "buttons cover"
      "tracks tracks"
      / 1fr auto;
`

const Buttons = styled.div`
   grid-area: buttons;
`

const Cover = styled.img`
   min-width: 200px;
   max-width: 100vw;
   width: 20vw;
   grid-area: cover;
`

export const getServerSideProps = authenticate(async (session, req) => {
   await database()

   const id = req.query.id as string

   const [playlist, rule, imported] = await Promise.all([
      getPlaylist(session, id),
      Rule.findOne({ playlist: id }).then(serialize),
      Tag.findOne({ importedFrom: id }).then(serialize),
   ])

   return { props: { ...playlist, rule, imported } }
})

export default Home
