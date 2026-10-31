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


const mongoClient = await connectToMongoDB();
const db = mongoClient.db("Beacon");
export const eventsCollection = db.collection("events");