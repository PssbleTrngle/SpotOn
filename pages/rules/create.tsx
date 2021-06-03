import styled from "@emotion/styled"
import { useRouter } from "next/router"
import { FC, useState } from "react"
import Button from "../../components/Button"
import useSubmit from "../../components/hooks/useSubmit"
import TextInput from "../../components/inputs/TextInput"
import Layout from "../../components/Layout"
import RuleForm, { exampleRule } from "../../components/RuleForm"
import { BorderLeft, BorderRight } from "../../components/styles/Border"
import Title from "../../components/Title"
import { IBaseRule, IRule } from "../../models/Rule"

export const Home: FC = () => {
   const router = useRouter()

   const [name, setName] = useState('')
   const [rule, setRule] = useState<IBaseRule>(exampleRule())

   const [submit] = useSubmit<IRule>('rule', { name }, { onSuccess: r => router.push(`/tags/${r.slug}`) })

   return (
      <Layout>

         <Title>Create Rule</Title>

         <Form onSubmit={submit}>

            <RuleForm value={rule} onChange={setRule} />

            <TextInput value={name} onChange={setName} />
            <Button>Create</Button>
       
         </Form>

      </Layout>
   )
}

const Form = styled.form`
   display: grid;
   column-gap: 0.3rem;
   row-gap: 2rem;

   justify-content: center;

   grid-template:
      "rule rule"
      "name submit";

   input {
      ${BorderLeft};
   }

   button {
      ${BorderRight};
   }
`

export default Home
