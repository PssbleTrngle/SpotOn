import styled from "@emotion/styled"
import { FC } from "react"
import Button from "../../components/Button"
import Layout from "../../components/Layout"
import Link from "../../components/Link"
import Title from "../../components/Title"
import database, { serialize } from "../../lib/database"
import authenticate from "../../middleware/authenticate"
import Rule, { IRule } from "../../models/Rule"

export const Home: FC<{ rules: IRule[] }> = ({ rules }) => {
   return (
      <Layout>

         <Title>Rules</Title>

         <List>
            {rules.map(rule =>
               <Link key={rule.id} href={`/rules/${rule.slug}`}>
                  <li>{rule.name}</li>
               </Link>
            )}
         </List>

         <Link href='/rules/create'>
            <Button>Create</Button>
         </Link>

      </Layout>
   )
}

const List = styled.ul`
`

export const getServerSideProps = authenticate(async session => {
   await database()

   const rules = await Rule.find({ user: session.user.id }).then(serialize)

   return { props: { rules } }
})

export default Home
