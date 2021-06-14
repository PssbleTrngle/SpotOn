import { darken } from 'polished'
import { FC } from 'react'
import styled from 'styled-components'
import Button from '../../components/Button'
import Layout from '../../components/Layout'
import Link from '../../components/Link'
import RuleView from '../../components/RuleView'
import Title from '../../components/Title'
import database, { serialize } from '../../lib/database'
import authenticate from '../../middleware/authenticate'
import Rule, { IRule } from '../../models/Rule'

export const Home: FC<{ rules: IRule[] }> = ({ rules }) => {
   return (
      <Layout>
         <Title>Rules</Title>

         <Link href='/rules/create'>
            <Button>Create</Button>
         </Link>

         <List>
            {rules.map(rule => (
               <Link key={rule.id} href={`/rules/${rule.slug}`}>
                  <li>
                     <span>{rule.name}</span>
                     <RuleView {...rule} />
                  </li>
               </Link>
            ))}
         </List>
      </Layout>
   )
}

const List = styled.ul`
   padding: 1rem;
   display: grid;
   gap: 1rem;

   li {
      padding: 2rem;
      display: grid;
      grid-template: 'name view';
      justify-content: space-between;
      align-items: center;

      transition: background 0.1s ease;
      &:hover {
         background: ${p => darken(0.02, p.theme.bg)};
      }

      & > span {
         font-size: 2rem;
      }
   }
`

export const getServerSideProps = authenticate(async session => {
   await database()

   const rules = await Rule.find({ user: session.user.id }).then(serialize)

   return { props: { rules } }
})

export default Home
