import express from 'express';
import cors from 'cors';
import userRouter from './src/routes/userRouter'

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use('/api/users', userRouter);

const port = process.env.PORT || 4343;

// Start the HTTP server (with Express + Socket.IO)
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});