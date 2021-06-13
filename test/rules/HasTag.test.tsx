import { ObjectID } from 'mongodb'
import { getSession } from 'next-auth/client'
import { ruleCorrect, ruleFailes } from '.'
import database from '../../lib/database'
import Tag from '../../models/Tag'

describe('HasTag Rules', () => {
   const tag = `${new ObjectID()}`

   if (process.env.MONGODB_URI) {
      beforeAll(async () => {
         process.env.MONGODB_DB = 'testing'
         await database()

         const session = await getSession()
         await Tag.create({ _id: tag, name: 'Test Tag', user: session!.user.id })
      })

      afterAll(async () => {
         const { connection } = await database()
         delete process.env.MONGODB_DB

         await connection.dropDatabase()
         await connection.close()
      })
   }

   it('has a mocked session', async () => {
      expect(await getSession()).not.toBeNull()
   })

   it('has a mongodb connection defined', () => {
      expect(process.env.MONGODB_URI).toBeDefined()
   })

   const type = 'hastag'

   ruleCorrect('with value', {
      type,
      display: 'display',
      value: tag,
   })

   ruleFailes(
      'without value',
      {
         type,
         display: 'test',
      },
      []
   )

   ruleFailes(
      'without children',
      {
         type,
      },
      []
   )

   ruleFailes(
      'with value',
      {
         type,
         value: '',
      },
      []
   )

   ruleFailes(
      'with children',
      {
         type,
         children: [],
      },
      []
   )

   ruleFailes(
      'with incorrect value type',
      {
         type,
         value: 0,
         display: 'test',
      },
      []
   )
})
