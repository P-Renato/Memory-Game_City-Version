import express from 'express';
import cors from 'cors';
import userRouter from './src/routes/userRouter';
import roomRouter from './src/routes/roomRouter';
import { connectToDatabase } from './src/db';
import { createServer } from 'http';
import { createWebSocketServer } from './src/websocket/server';

const app = express();
const server = createServer(app);

app.use(cors({
    origin: ["http://localhost:5173", "https://memory-game-city-version.onrender.com"],
    credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));



connectToDatabase()
createWebSocketServer(server);

app.use('/api/users', userRouter);
app.use('/api/rooms', roomRouter);

const port = process.env.PORT || 4343;

// Start the HTTP server (with Express + Socket.IO)
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});