import 'dotenv/config'
import express from 'express';
import cors from "cors";
import { eventsCollection } from './database/connect.js';
import { ObjectId } from 'mongodb';
import { readFile } from 'fs/promises';

//initialize server
const app = express();
const PORT = 8080;
app.use(cors());
app.use(express.json());

// Base route
app.get('/', async(req, res) => {
    const file = await readFile('./endpoints.json', 'utf-8');
    const data = JSON.parse(file);

    // add the baseurl in front of every path
    data.endpoints.forEach(endpoint => {
        endpoint.path = data.baseurl + endpoint.path;
    });

    res.send(data);
});

// Events Routes
app.post("/events", async(req, res) => {
    const event = req.body;
    const result = await eventsCollection.insertOne(event)
    res.send(result);
});
app.get("/events", async(req, res) => {
    const data = await eventsCollection.find().toArray();
    res.send(data);
});

// Upcoming Events
app.get("/events/upcoming", async(req, res) => {
    const now = new Date().toISOString();
    const limit = parseInt(req.query.limit) || 0; 
    const data = await eventsCollection
        .find({ date: { $gt: now } })
        .sort({ date: 1 })
        .limit(limit)
        .toArray();
    res.send(data);
});

app.get("/upcoming-events/:id", async(req, res) => {
    const id = req.params.id;
    const data = await eventsCollection.findOne({_id: new ObjectId(id)});
    res.send(data);
});

// Manage Events
app.get("/manage-events/:id", async(req, res) => {
    const id = req.params.id;
    const data = await eventsCollection.find({hostID: id}).toArray();
    res.send(data);
});


app.listen(PORT, ()=>{
    console.log(`Server running on port: http://localhost:${PORT}`)
});