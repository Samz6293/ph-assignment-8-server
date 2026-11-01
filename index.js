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

    // All Events
app.get("/events", async(req, res) => {
    const data = await eventsCollection.find().toArray();
    res.send(data);
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

// Join Event
app.patch("/events/:id/join", async(req, res) => {
    const id = req.params.id;
    const { userId, name, email, image } = req.body;

    // verifying if event exists
    const event = await eventsCollection.findOne({_id: new ObjectId(id)});
    if(!event) return res.status(404).send({message: "This event no longer exists"});

    // verifying past event
    const now = new Date().toISOString();
    if(event.date < now) return res.status(400).send({message: "This event already happened"});

    // host can't join their own event
    if(userId === event.hostID) return res.status(403).send({message: "You are the host of the event. You are going anyway!"});

    const result = await eventsCollection.updateOne(
        { _id: new ObjectId(id), "joinedPeople.userId": { $ne: userId } },
        { $push: { joinedPeople: { userId, name, email, image, joinedAt: new Date().toISOString() } } }
    );

    // nothing changed = already in the array
    if(result.modifiedCount === 0) return res.status(409).send({message: "You already joined this event"});

    res.send(result);
});

// Events a user joined
app.get("/joined-events/:userId", async(req, res) => {
    const userId = req.params.userId;
    const data = await eventsCollection
        .find({ "joinedPeople.userId": userId })
        .sort({ date: 1 })
        .toArray();
    res.send(data);
});

// Leave Event
app.patch("/events/:id/leave", async(req, res) => {
    const id = req.params.id;
    const { userId } = req.body;

    // verifying if event exists
    const event = await eventsCollection.findOne({_id: new ObjectId(id)});
    if(!event) return res.status(404).send({message: "This event no longer exists"});

    // can't leave an event that already happened
    const now = new Date().toISOString();
    if(event.date < now) return res.status(400).send({message: "This event already happened"});

    // remove the person whose userId matches from the array
    const result = await eventsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { joinedPeople: { userId: userId } } }
    );

    // nothing changed = they were not in the array
    if(result.modifiedCount === 0) return res.status(409).send({message: "You haven't joined this event"});

    res.send(result);
});



app.listen(PORT, ()=>{
    console.log(`Server running on port: http://localhost:${PORT}`)
});