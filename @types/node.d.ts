import mongoose from 'mongoose';
import Cache from 'node-cache';

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
         cache: Cache
      }
   }
}
