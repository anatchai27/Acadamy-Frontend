import { api } from './api';

export const getRooms = (options = {}) => api.get('/rooms', options);
export const createRoom = payload => api.post('/rooms', payload);
export const updateRoom = (id, payload) => api.put(`/rooms/${id}`, payload);
export const deleteRoom = id => api.delete(`/rooms/${id}`);

export const roomService = { getRooms, createRoom, updateRoom, deleteRoom };
