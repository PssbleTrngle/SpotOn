import { useRouter } from "next/router"
import { FC, useReducer } from "react"
import Button from "../../components/Button"
import useSubmit from "../../components/hooks/useSubmit"
import RoundForm from "../../components/inputs/RoundForm"
import TextInput from "../../components/inputs/TextInput"
import Layout from "../../components/Layout"
import Title from "../../components/Title"
import { ITag } from "../../models/Tag"

export const Home: FC = () => {
   const router = useRouter()

   const [name, setName] = useReducer(
      (_: string, s: string) => s
         .toLowerCase()
         .replace(/[^a-z0-9_ -]/gmi, '')
         .replace(/\s+/g, ' ')
      , ''
   )

   const [submit] = useSubmit<ITag>('tag', { name }, { onSuccess: t => router.push(`/tags/${t.slug}`) })

   return (
      <Layout>

         <Title>Create Tag</Title>

         <RoundForm onSubmit={submit}>
            <TextInput value={name} onChange={setName} />
            <Button>Create</Button>
         </RoundForm>

      </Layout>
   )
}

export default Home
