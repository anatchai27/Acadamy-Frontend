import { api } from './api';

export const getProducts = (options = {}) => {
  return api.get('/products', options);
}

export const getProductById = id => {
  return api.get(`/products/${id}`);
}

export const createProduct = payload => {
  return api.post('/products', payload);
}

export const updateProduct = (id, payload) => {
  return api.put(`/products/${id}`, payload);
}

export const deleteProduct = id => {
  return api.delete(`/products/${id}`);
}

export const productService = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
