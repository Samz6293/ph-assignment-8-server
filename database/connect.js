import { MongoClient } from 'mongodb';
import 'dotenv/config'

const client = new MongoClient(process.env.DATABASE_URI);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Successfully connected to Database!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}