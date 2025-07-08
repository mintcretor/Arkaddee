// services/reviewService.js
import api from './baseapi';
import axios from 'axios';
import { BASEAPI_CONFIG } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';


// ดึงรายการรีวิวทั้งหมดของร้านค้า
export const fetchStoreReviews = async (storeId, page = 1, limit = 10) => {
  try {
    const response = await api.get(`/reviews/store/${storeId}`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching store reviews:', error);
    throw error;
  }
};

export const fetchUserReviews = async (userId, page = 1, limit = 10) => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    const response = await api.post('/reviews/user',
      { userId }, // request body
      {
        params: { page, limit }, // query parameters
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    throw error;
  }
}

// ดึงข้อมูลสถิติของรีวิวสำหรับร้านค้า
export const fetchReviewStats = async (storeId) => {
  try {
    const response = await api.get(`/reviews/stats/${storeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching review stats:', error);
    throw error;
  }
};

// ดึงข้อมูลรีวิวเดี่ยวโดย ID
export const fetchReviewById = async (reviewId) => {
  try {
    const response = await api.get(`/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching review:', error);
    throw error;
  }
};

// สร้างรีวิวใหม่
export const createReview = async (reviewData) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await api.post('/reviews', reviewData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

// อัปเดตรีวิวที่มีอยู่
export const updateReview = async (reviewId, reviewData) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await api.put(`/reviews/${reviewId}`, reviewData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

// ลบรีวิว
export const deleteReview = async (reviewId) => {
  console.log('Deleting review with ID:', reviewId);
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await api.delete(`/reviews/${reviewId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

// กดไลค์หรือยกเลิกไลค์รีวิว
export const toggleLikeReview = async (reviewId) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await api.post(`/reviews/${reviewId}/like`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error toggling review like:', error);
    throw error;
  }
};

// อัปโหลดรูปภาพรีวิว
export const uploadReviewImages = async (images) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const formData = new FormData();

    for (const image of images) {
      const uriParts = image.split('.');
      const fileExtension = uriParts[uriParts.length - 1];

      formData.append('images', {
        uri: image,
        name: `review-${Date.now()}.${fileExtension}`,
        type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`
      });
    }

    const uploadConfig = {
      method: 'post',
      url: `${BASEAPI_CONFIG.baseUrl}/upload/multiple`,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      data: formData
    };

    const response = await axios(uploadConfig);
    return response.data;
  } catch (error) {
    console.error('Error uploading review images:', error);
    throw error;
  }
};

export default {
  fetchStoreReviews,
  fetchReviewStats,
  fetchUserReviews,
  fetchReviewById,
  createReview,
  updateReview,
  deleteReview,
  toggleLikeReview,
  uploadReviewImages
};