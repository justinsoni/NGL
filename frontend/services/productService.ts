import api, { ApiResponse } from './api';
import { Product } from '../types';

export const productService = {
    // Get all products with optional filters
    getProducts: async (filters?: { category?: string; gender?: string; sort?: string }) => {
        const response = await api.get<ApiResponse<Product[]>>('/products', { params: filters });
        return response.data;
    },

    // Get single product by ID
    getProductById: async (id: string) => {
        const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
        return response.data;
    },

    // Create new product (Admin only)
    createProduct: async (productData: any) => {
        // Strip id/id fields to avoid Mongoose validation errors
        const { id, _id, ...cleanData } = productData;
        const response = await api.post<ApiResponse<Product>>('/products', cleanData);
        return response.data;
    },

    // Update existing product (Admin only)
    updateProduct: async (id: string, productData: Partial<Product>) => {
        const response = await api.put<ApiResponse<Product>>(`/products/${id}`, productData);
        return response.data;
    },

    // Delete product (Admin only)
    deleteProduct: async (id: string | number) => {
        const response = await api.delete<ApiResponse<any>>(`/products/${id}`);
        return response.data;
    }
};
