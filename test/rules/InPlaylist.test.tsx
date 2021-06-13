import { getSession } from 'next-auth/client'

describe('InPlaylist rules', () => {
   it('has a mocked session', async () => {
      expect(await getSession()).not.toBeNull()
   })
})
