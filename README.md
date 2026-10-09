
# Prodigy InfoTech - Task 04
## Caching with Redis

A REST API built with Node.js, Express, TypeScript, Prisma, MySQL, and Redis. Redis caching reduces repeated database queries when fetching users.

## Features

- REST API for user management
- Create, read, update, and delete users
- Redis caching for the GET /users endpoint
- Cache expiration using a configurable TTL
- Cache invalidation after creating, updating, or deleting a user
- Cache status reported through the X-Cache response header
- Health-check endpoint for Redis connectivity

## Technologies Used

- Node.js
- Express.js
- TypeScript
- MySQL
- Prisma ORM
- Redis
- Docker

## Prerequisites

- Node.js and npm
- MySQL
- Docker Desktop
- A running Redis container

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/prodigy_wd_04"
   PORT=3000
   REDIS_URL="redis://localhost:6379"
   CACHE_TTL=60
   ```

   Replace `USER` and `PASSWORD` with your local MySQL credentials.

3. Start Redis if the container already exists:

   ```bash
   docker start prodigy-redis
   ```

4. Generate Prisma Client:

   ```bash
   npx prisma generate
   ```

5. Apply the existing database migrations:

   ```bash
   npx prisma migrate deploy
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

The API runs at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check API and Redis status |
| GET | `/users` | Retrieve users with Redis caching |
| POST | `/users` | Create a user |
| PUT | `/users/:id` | Update a user |
| DELETE | `/users/:id` | Delete a user |

### Example: Create a user

Send a POST request to `/users` with JSON:

```json
{
  "name": "Test User",
  "email": "testuser@example.com",
  "age": 22
}
```

### Cache Behavior

- `X-Cache: MISS` means the users list was fetched from MySQL and cached in Redis.
- `X-Cache: HIT` means the users list was served from Redis.
- The cache expires after the configured TTL.
- Creating, updating, or deleting a user invalidates the cached users list.

## Available Scripts

- `npm run dev` - Run the development server
- `npm run build` - Compile TypeScript
- `npm start` - Run the compiled application

## Project Status

The API endpoints, Redis cache behavior, cache invalidation, and TypeScript build have been tested locally.
