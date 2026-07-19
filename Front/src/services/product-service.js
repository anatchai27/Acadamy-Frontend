import { api } from './api';

export function getProducts(options = {}) {
  return api.get('/products', options);
}

export function getProductById(id) {
  return api.get(`/products/${id}`);
}

export function createProduct(payload) {
  return api.post('/products', payload);
}

export function updateProduct(id, payload) {
  return api.put(`/products/${id}`, payload);
}

export function deleteProduct(id) {
  return api.delete(`/products/${id}`);
}

export const productService = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
