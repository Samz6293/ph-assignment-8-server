import 'dotenv/config'
import express from 'express';
import { connectToMongoDB } from './database/connect.js';

connectToMongoDB();
const app = express();
const PORT = 8080;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(PORT, ()=>{
    console.log(`Server running on port: http://localhost:${PORT}`)
});