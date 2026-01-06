import express from 'express';
import { getRooms, createRoom, getRoom, deleteRoom, getAvailableRooms, joinRoom, playerReady, startGame, gameAction } from '../controllers/roomController';
import { checkAuth } from '../middlawares/authMiddleware';

const roomRouter = express.Router();

roomRouter.get('/list', checkAuth, getRooms );
roomRouter.get('/:id', checkAuth, getRoom );
roomRouter.get('/available', checkAuth, getAvailableRooms );

roomRouter.post('/:id/ready', checkAuth, playerReady);        
roomRouter.post('/:id/start', checkAuth, startGame);          
roomRouter.post('/:id/action', checkAuth, gameAction);        
roomRouter.post('/:id/join', checkAuth, joinRoom);

roomRouter.post('/', checkAuth, createRoom );
roomRouter.post('/:id/join', checkAuth, joinRoom );
roomRouter.delete('/:id', checkAuth, deleteRoom);

export default roomRouter;