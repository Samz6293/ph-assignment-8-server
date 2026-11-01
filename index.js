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

    // Delete an event
app.delete("/events/:id", async(req, res) => {
    const id = req.params.id;
    const result = await eventsCollection.deleteOne({_id: new ObjectId(id)});
    res.send(result);
});

    // Update an event
app.patch("/events/:id", async(req, res) => {
    const id = req.params.id;
    const updatedDdata = req.body;
    const result = await eventsCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: updatedDdata}
    );
    res.send(result);
});
    // Previous Events
app.get("/events/previous", async(req, res) => {
    const now = new Date().toISOString();
    const data = await eventsCollection
        .find({date: {$lt: now}})
        .toArray();
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

// Event details route
app.get("/event-details/:id", async(req, res) => {
    const id = req.params.id;
    const data = await eventsCollection.findOne({_id: new ObjectId(id)});
    res.send(data);
});

// Manage events route
app.get("/manage-events/:id", async(req, res) => {
    const id = req.params.id;
    const data = await eventsCollection
        .find({hostID: id})
        .sort({ date: 1 })
        .toArray();
    res.send(data);
});



app.listen(PORT, ()=>{
    console.log(`Server running on port: http://localhost:${PORT}`)
});