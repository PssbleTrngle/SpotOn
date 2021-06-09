import styled from "@emotion/styled"
import { shuffle } from "lodash"
import { GetStaticProps } from "next"
import { useRouter } from "next/router"
import { FC, useState } from "react"
import Button from "../../components/Button"
import useSubmit from "../../components/hooks/useSubmit"
import TextInput from "../../components/inputs/TextInput"
import Layout from "../../components/Layout"
import RuleForm from "../../components/RuleForm"
import { BorderLeft, BorderRight } from "../../components/styles/Border"
import Title from "../../components/Title"
import { IBaseRule, IRule } from "../../models/Rule"

export const Home: FC<{
   example: IBaseRule
}> = ({ example }) => {
   const router = useRouter()

   const [name, setName] = useState('')
   const [rule, setRule] = useState<IBaseRule>(example)
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
      children: new Array(2).fill(null).map(() => ({
         type: shuffle(['hastag', 'inplaylist'])[0]
      })).map(c => ({
         ...c, display: c.type
      }))
   }
}

export const getStaticProps: GetStaticProps = async () => {
   return { props: { example: exampleRule() } }
}

const Form = styled.form`
   display: grid;
   column-gap: 0.3rem;
   row-gap: 2rem;

   justify-content: center;

   grid-template:
      ". name submit ."
      "rule rule rule rule";

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
