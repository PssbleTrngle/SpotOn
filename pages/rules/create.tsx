import { random, shuffle } from 'lodash'
import { GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { FC, useState } from 'react'
import styled from 'styled-components'
import Button from '../../components/Button'
import useSubmit from '../../components/hooks/useSubmit'
import TextInput from '../../components/inputs/TextInput'
import Layout from '../../components/Layout'
import RuleForm from '../../components/RuleForm'
import { BorderLeft, BorderRight } from '../../components/styles/Border'
import Title from '../../components/Title'
import { IBaseRule, IRule } from '../../models/Rule'

export const Home: FC<{
   examples: IBaseRule[]
}> = ({ examples }) => {
   const router = useRouter()

   const [name, setName] = useState('')
   const [rule, setRule] = useState<IBaseRule>(examples[random(0, examples.length - 1)])
   const [valid, setValid] = useState(false)

   const [submit] = useSubmit<IRule>('rule', { name, ...rule }, { onSuccess: r => router.push(`/rules/${r.slug}`) })

   return (
      <Layout>
         <Title>Create Rule</Title>

         <Form onSubmit={submit}>
            <RuleForm value={rule} onChange={setRule} onError={e => setValid(!e?.length)} />

            <TextInput value={name} onChange={setName} />
            <Button disabled={!valid}>Create</Button>
         </Form>
      </Layout>
   )
}

function exampleRule(): IBaseRule {
   const type = shuffle(['and', 'or'])[0]
   return {
      type,
      composite: true,
      children: new Array(2)
         .fill(null)
         .map(() => ({
            type: shuffle(['hastag', 'inplaylist'])[0],
         }))
         .map(c => ({
            ...c,
            composite: false,
         })),
   }
}

export const getStaticProps: GetStaticProps = async () => {
   const examples = new Array(10).fill(null).map(exampleRule)
   return { props: { examples } }
}

const Form = styled.form`
   display: grid;
   column-gap: 0.3rem;
   row-gap: 2rem;

   justify-content: center;

   grid-template:
      '. name submit .'
      'rule rule rule rule';

   input {
      grid-area: name;
      ${BorderLeft};
   }

   button {
      grid-area: submit;
      ${BorderRight};
   }
`

export default Home
