import { RequestHandler, Router } from 'express';
import {
  getRooms,
  getOneRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  getAvailableRooms,
} from '../controller/room.ctr';

const RoomRouter: Router = Router();

RoomRouter.get('/get_rooms', getRooms as RequestHandler);
RoomRouter.get('/get_one_room/:id', getOneRoom as RequestHandler);
RoomRouter.post('/create_room', createRoom as RequestHandler);
RoomRouter.put('/update_room/:id', updateRoom as RequestHandler);
RoomRouter.delete('/delete_room/:id', deleteRoom as RequestHandler);
RoomRouter.get('/get_available_rooms', getAvailableRooms as RequestHandler);

export { RoomRouter };