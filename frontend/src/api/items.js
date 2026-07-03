import client from './client';

export const listItems = () => client.get('/items').then((res) => res.data);
export const createItem = (payload) => client.post('/items', payload).then((res) => res.data);
export const updateItem = (id, payload) => client.put(`/items/${id}`, payload).then((res) => res.data);
export const deleteItem = (id) => client.delete(`/items/${id}`).then((res) => res.data);
