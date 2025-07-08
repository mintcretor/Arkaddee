import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RecentlyViewedContext = createContext();

export const useRecentlyViewed = () => {
    const context = useContext(RecentlyViewedContext);
    if (!context) {
        throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
    }
    return context;
};

export const RecentlyViewedProvider = ({ children }) => {
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // โหลดข้อมูลจาก AsyncStorage เมื่อเริ่มต้น
    useEffect(() => {
        loadRecentlyViewed();
    }, []);

    const loadRecentlyViewed = async () => {
        try {
            const data = await AsyncStorage.getItem('recentlyViewed');
            if (data) {
                setRecentlyViewed(JSON.parse(data));
            }
        } catch (error) {
            console.error('Error loading recently viewed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // เพิ่มร้านใหม่ในประวัติ
    const addToRecentlyViewed = async (restaurant:any) => {
        try {
            // สร้างข้อมูลสำหรับเก็บ
            const viewedItem = {
                id: restaurant.id,
                name: restaurant.name,
                image: restaurant.images?.[0] || null,
                rating: restaurant.reviewSummary?.average_rating || 0,
                viewedAt: new Date().toISOString(),
                // เก็บข้อมูลพื้นฐานที่จำเป็น
                address: restaurant.address,
                cuisines: restaurant.cuisines,
                price_range: restaurant.price_range,
            };

            setRecentlyViewed(prev => {
                // ลบรายการเดิม (ถ้ามี) และเพิ่มใหม่ที่ด้านบน
                const filtered = prev.filter(item => item.id !== restaurant.id);
                const updated = [viewedItem, ...filtered].slice(0, 20); // เก็บแค่ 20 รายการล่าสุด
                
                // บันทึกลง AsyncStorage
                AsyncStorage.setItem('recentlyViewed', JSON.stringify(updated));
                return updated;
            });
        } catch (error) {
            console.error('Error adding to recently viewed:', error);
        }
    };

    // ลบรายการออกจากประวัติ
    const removeFromRecentlyViewed = async (restaurantId) => {
        try {
            setRecentlyViewed(prev => {
                const updated = prev.filter(item => item.id !== restaurantId);
                AsyncStorage.setItem('recentlyViewed', JSON.stringify(updated));
                return updated;
            });
        } catch (error) {
            console.error('Error removing from recently viewed:', error);
        }
    };

    // ล้างประวัติทั้งหมด
    const clearRecentlyViewed = async () => {
        try {
            setRecentlyViewed([]);
            await AsyncStorage.removeItem('recentlyViewed');
        } catch (error) {
            console.error('Error clearing recently viewed:', error);
        }
    };

    return (
        <RecentlyViewedContext.Provider
            value={{
                recentlyViewed,
                isLoading,
                addToRecentlyViewed,
                removeFromRecentlyViewed,
                clearRecentlyViewed,
            }}
        >
            {children}
        </RecentlyViewedContext.Provider>
    );
};
