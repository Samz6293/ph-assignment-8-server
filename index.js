import 'dotenv/config'
import express from 'express';
import cors from "cors";
import { eventsCollection } from './database/connect.js';

//initialize server
const app = express();
const PORT = 8080;
app.use(cors());
app.use(express.json());


// Read routes
app.get('/', (req, res) => {
    res.send({message: "API Working"});
});

// Create Routes
app.post("/events", async(req, res) => {
    const event = req.body;
    const result = await eventsCollection.insertOne(event)
    res.send(result);
})

app.listen(PORT, ()=>{
    console.log(`Server running on port: http://localhost:${PORT}`)
});