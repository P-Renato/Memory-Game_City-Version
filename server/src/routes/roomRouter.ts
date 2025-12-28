import express from 'express';
import { getRooms, createRoom, getRoom, deleteRoom, getAvailableRooms } from '../controllers/roomController';
import { checkAuth } from '../middlawares/authMiddleware';

const roomRouter = express.Router();

roomRouter.get('/list', checkAuth, getRooms );
roomRouter.get('/:id', checkAuth, getRoom );
roomRouter.get('/available', checkAuth, getAvailableRooms );
roomRouter.post('/', checkAuth, createRoom );
roomRouter.post('/:id/join', checkAuth, createRoom );
roomRouter.delete('/:id', checkAuth, deleteRoom);

export default roomRouter;