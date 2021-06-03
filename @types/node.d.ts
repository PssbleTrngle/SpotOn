import mongoose from 'mongoose';

interface DB {
   client: MongoClient
   db: Db
}

declare global {
   namespace NodeJS {
      interface Global {
         mongo: {
            conn?: typeof mongoose
            promise?: Promise<typeof mongoose>
         }
      }
   }
}
