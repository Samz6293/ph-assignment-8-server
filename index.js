import 'dotenv/config'
import express from 'express';
import { connectToMongoDB } from './database/connect.js';

connectToMongoDB();
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000);