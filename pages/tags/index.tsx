import styled from "@emotion/styled"
import { FC } from "react"
import Layout from "../../components/Layout"
import TagLabel from "../../components/TagLabel"
import Title from "../../components/Title"
import database, { serialize } from "../../lib/database"
import authenticate from "../../middleware/authenticate"
import Tag, { ITag } from "../../models/Tag"

export const Home: FC<{ tags: ITag[] }> = ({ tags }) => {
   return (
      <Layout>

         <Title>Tags</Title>

         <List>
            {tags.map(tag =>
               <li key={tag.id} >
                  <TagLabel size={2} {...tag} />
               </li>
            )}
         </List>

      </Layout>
   )
}

const List = styled.ul`
   display: grid;
   grid-auto-flow: column;
   justify-content: center;
`

export const getServerSideProps = authenticate(async session => {
   await database()

   const tags = await Tag.find({ user: session.user.id }).then(serialize)

   return { props: { tags } }
})

export default Home
