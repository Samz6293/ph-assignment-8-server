# Beacon Server

The REST API for **Beacon**, a community events app where people host local events (cleanups, plantations, donation drives, health camps, education drives) and others join them.

**Live API:** https://ph-assignment-8-server.vercel.app/

The frontend lives in [ph-assignment-8-client](https://github.com/Samz6293/ph-assignment-8-client).

## Features

- Create, update and delete events. Only the host can change or delete their own event.
- Upcoming events list, sorted soonest first, with an optional limit.
- Join and leave events. Each event keeps a `joinedPeople` list.
- A user can't join their own event, join the same event twice, or join or leave an event that has already happened.
- Private routes are protected with a JWT. The token comes from the client's Better Auth login and is checked against the client's JWKS endpoint.

## Tech stack

- **Node.js + Express 5**
- **MongoDB** (official `mongodb` driver)
- **jose** to verify JWTs
- **cors**, **dotenv**
- Deployed on **Vercel**

## API endpoints

🔒 means the route needs an `Authorization: Bearer <token>` header.

| Path | Method | Description |
|---|---|---|
| `/` | GET | Health check |
| `/events/upcoming` | GET | Upcoming events, soonest first. Optional `?limit=N` |
| `/event-details/:id` | GET | One event by its ID |
| `/events` | GET | 🔒 All events |
| `/events/previous` | GET | 🔒 Events whose date has passed |
| `/events` | POST | 🔒 Create an event (JSON body) |
| `/events/:id` | PATCH | 🔒 Update an event (host only) |
| `/events/:id` | DELETE | 🔒 Delete an event (host only) |
| `/manage-events/:id` | GET | 🔒 Events hosted by the logged-in user, sorted by date |
| `/events/:id/join` | PATCH | 🔒 Join an event (JSON body: `name`, `email`, `image`) |
| `/events/:id/leave` | PATCH | 🔒 Leave an event |
| `/joined-events/:userId` | GET | 🔒 Events the logged-in user joined, sorted by date |

Errors come back as `{ "message": "..." }` with a matching status code (`401`, `403`, `404`, `409`, `400`).

## Run locally

1. Clone the repo and install the packages:

   ```bash
   git clone https://github.com/Samz6293/ph-assignment-8-server.git
   cd ph-assignment-8-server
   npm install
   ```

2. Create a `.env` file in the project folder:

   ```env
   DATABASE_URI=your_mongodb_connection_string
   FRONT_END_URL=http://localhost:3000
   ```

   `FRONT_END_URL` is the client app's URL. The server uses it to fetch the keys that verify login tokens.

3. Start the server:

   ```bash
   npm run dev
   ```

   The API runs at http://localhost:8080. The `dev` script uses `nodemon`. If it isn't installed, run `npm install -g nodemon` or start the server with `node index.js`.

## Project structure

```
├── database/
│   └── connect.js   # MongoDB connection, exports the events collection
├── index.js         # Express app, middleware and all routes
└── package.json
```
