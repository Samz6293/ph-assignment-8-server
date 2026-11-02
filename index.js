import 'dotenv/config'
import express from 'express';
import cors from "cors";
import { eventsCollection } from './database/connect.js';
import { ObjectId } from 'mongodb';
import { createRemoteJWKSet, jwtVerify } from 'jose';

//initialize server
const app = express();
const PORT = 8080;
app.use(cors());
app.use(express.json());

// Middleware
const JWKS = createRemoteJWKSet(new URL(`${process.env.FRONT_END_URL}/api/auth/jwks`));
const verifyToken = async(req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader) return res.status(401).send({message: "Please log in first"});
    
    const token = authHeader.split(" ")[1];
    if(!token) return res.status(401).send({message: "Please log in first"});

    try {
        const { payload } = await jwtVerify(token, JWKS);
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).send({message: "Your login expired. Please log in again"});
    }
}

// Base route
app.get('/', (req, res) => {
    res.send({message: "API Working | Private routes are protected :)"});
});

// Events Routes
app.post("/events", verifyToken, async(req, res) => {
    const event = req.body;
    if(event.hostID !== req.user.id) return res.status(403).send({message: "You can only host events as yourself"});

    const result = await eventsCollection.insertOne(event)
    res.send(result);
});

    // Delete an event
app.delete("/events/:id", verifyToken, async(req, res) => {
    const id = req.params.id;

    // verifying if event exists
    const event = await eventsCollection.findOne({_id: new ObjectId(id)});
    if(!event) return res.status(404).send({message: "This event no longer exists"});

    // only the host can delete their event
    if(event.hostID !== req.user.id) return res.status(403).send({message: "Only the host can delete this event"});

    const result = await eventsCollection.deleteOne({_id: new ObjectId(id)});
    res.send(result);
});

    // Update an event
app.patch("/events/:id", verifyToken, async(req, res) => {
    const id = req.params.id;

    // verifying if event exists
    const event = await eventsCollection.findOne({_id: new ObjectId(id)});
    if(!event) return res.status(404).send({message: "This event no longer exists"});

    // only the host can update their event
    if(event.hostID !== req.user.id) return res.status(403).send({message: "Only the host can update this event"});

    const { title, type, date, location, thumbnail, description } = req.body;
    const result = await eventsCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: { title, type, date, location, thumbnail, description }}
    );
    res.send(result);
});

    // All Events
app.get("/events", verifyToken, async(req, res) => {
    const data = await eventsCollection.find().toArray();
    res.send(data);
});
    // Previous Events
app.get("/events/previous", verifyToken, async(req, res) => {
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
app.get("/manage-events/:id", verifyToken, async(req, res) => {
    const id = req.params.id;

    // users can only see the events they host
    if(id !== req.user.id) return res.status(403).send({message: "You can only see your own events"});

    const data = await eventsCollection
        .find({hostID: id})
        .sort({ date: 1 })
        .toArray();
    res.send(data);
});

// Join Event
app.patch("/events/:id/join", verifyToken, async(req, res) => {
    const id = req.params.id;
    const userId = req.user.id;
    const { name, email, image } = req.body;

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
app.get("/joined-events/:userId", verifyToken, async(req, res) => {

    const userId = req.params.userId;
    if(userId !== req.user.id) return res.status(403).send({message: "You can only see your own joined events"});

    const data = await eventsCollection
        .find({ "joinedPeople.userId": userId })
        .sort({ date: 1 })
        .toArray();
    res.send(data);
});

// Leave Event
app.patch("/events/:id/leave", verifyToken, async(req, res) => {
    const id = req.params.id;
    const userId = req.user.id;

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

export default app;