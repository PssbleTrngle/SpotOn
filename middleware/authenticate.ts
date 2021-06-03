
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { Session } from 'next-auth'
import { getSession } from 'next-auth/client'
import { ParsedUrlQuery } from 'querystring'

type AuthenticatedServerSideProps<
   P extends { [key: string]: any } = { [key: string]: any },
   Q extends ParsedUrlQuery = ParsedUrlQuery
   > = (
      session: Session,
      context: GetServerSidePropsContext<Q>
   ) => Promise<GetServerSidePropsResult<P>>

const withSession = (func: AuthenticatedServerSideProps): GetServerSideProps => async ctx => {
   const session = await getSession(ctx)
   if (session) return func(session, ctx)
   return {
      redirect: {
         permanent: false,
         destination: '/api/auth/signin'
      }
   }
}

export default withSession