import api, { ApiResponse } from './api';

export interface Media {
  _id: string;
  title: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  category: string;
  createdAt: string;
}

export const mediaService = {
  // Get all media
  getMedia: async () => {
    const response = await api.get<ApiResponse<Media[]>>('/media');
    return response.data;
  },

  // Create new media (Admin only)
  addMedia: async (mediaData: { title: string; youtubeUrl: string; thumbnailUrl: string; category: string }) => {
    const response = await api.post<ApiResponse<Media>>('/media', mediaData);
    return response.data;
  }
};
