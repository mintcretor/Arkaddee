import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BASEAPI_CONFIG } from '@/config';
import { useTranslation } from 'react-i18next';

interface ArticleItem {
  id: string | number;
  title: string;
  summary: string;
  image_url: string;
  published_date: string;
  category: string;
  read_time: string;
}

const ArticlesListPage: React.FC = () => {
    const { t } = useTranslation();
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<ArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'ทั้งหมด' },
    { id: 'pm25', name: 'PM2.5' },
    { id: 'health', name: 'สุขภาพ' },
    { id: 'environment', name: 'สิ่งแวดล้อม' },
    { id: 'tips', name: 'เคล็ดความรู้' },
  ];

  // Mock data for demonstration - replace with API call
  useEffect(() => {
    // Simulating API fetch
    setTimeout(() => {
      const mockArticles = [
        {
          id: 1,
          title: 'วิธีป้องกันตัวเองจาก PM2.5 ในชีวิตประจำวัน',
          summary: 'เรียนรู้วิธีป้องกันตัวเองจากฝุ่นละออง PM2.5 ที่สามารถทำได้ง่ายๆ ในชีวิตประจำวัน',
          image_url: `${BASEAPI_CONFIG.UrlImg}/articles/pm25-safety.jpg`,
          published_date: '15 ธ.ค. 2023',
          category: 'pm25',
          read_time: '5 นาที'
        },
        {
          id: 2,
          title: 'ทำไมต้องใช้หน้ากาก N95 เมื่อค่า PM2.5 สูง',
          summary: 'ทำความเข้าใจประสิทธิภาพของหน้ากาก N95 และเหตุผลที่ควรสวมใส่เมื่อค่าฝุ่น PM2.5 สูง',
          image_url: `${BASEAPI_CONFIG.UrlImg}/articles/n95-mask.jpg`,
          published_date: '10 ธ.ค. 2023',
          category: 'pm25',
          read_time: '3 นาที'
        },
        {
          id: 3,
          title: 'อาหาร 10 ชนิดช่วยต้านพิษฝุ่น',
          summary: 'อาหารที่ช่วยเสริมภูมิคุ้มกันและลดผลกระทบจากมลพิษทางอากาศที่ควรรับประทานเป็นประจำ',
          image_url: `${BASEAPI_CONFIG.UrlImg}/articles/food-anti-pollution.jpg`,
          published_date: '5 ธ.ค. 2023',
          category: 'health',
          read_time: '4 นาที'
        },
        {
          id: 4,
          title: 'พืชฟอกอากาศที่ควรมีในบ้าน',
          summary: 'รู้จักพืชที่ช่วยฟอกอากาศและลดมลพิษในบ้าน พร้อมวิธีการดูแลอย่างถูกต้อง',
          image_url: `${BASEAPI_CONFIG.UrlImg}/articles/air-purifying-plants.jpg`,
          published_date: '1 ธ.ค. 2023',
          category: 'environment',
          read_time: '6 นาที'
        },
        {
          id: 5,
          title: 'ผลกระทบของ PM2.5 ต่อสุขภาพในระยะยาว',
          summary: 'ทำความเข้าใจผลกระทบของ PM2.5 ต่อสุขภาพในระยะยาว และความเสี่ยงที่อาจเกิดขึ้น',
          image_url: `${BASEAPI_CONFIG.UrlImg}/articles/pm25-health-effects.jpg`,
          published_date: '25 พ.ย. 2023',
          category: 'health',
          read_time: '7 นาที'
        },
        {
          id: 6,
          title: 'วิธีใช้เครื่องฟอกอากาศให้มีประสิทธิภาพสูงสุด',
          summary: 'เคล็ดลับในการใช้เครื่องฟอกอากาศให้เกิดประโยชน์สูงสุดในการกรองฝุ่น PM2.5',
          image_url: `${BASEAPI_CONFIG.UrlImg}/articles/air-purifier-tips.jpg`,
          published_date: '20 พ.ย. 2023',
          category: 'tips',
          read_time: '5 นาที'
        }
      ];

      setArticles(mockArticles);
      setFilteredArticles(mockArticles);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchText, selectedCategory, articles]);

  const filterArticles = () => {
    let filtered = [...articles];

    // Filter by search text
    if (searchText.trim() !== '') {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchText.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    setFilteredArticles(filtered);
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId === 'all' ? null : categoryId);
  };

  const renderArticleItem = ({ item }: { item: ArticleItem }) => (
    <TouchableOpacity
      style={styles.articleCard}
      onPress={() => router.push({
        pathname: '/articles/[id]',
        params: { id: item.id }
      })}
    >
      <View style={styles.articleImageContainer}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.articleImage}
          defaultSource={require('@/assets/images/logo.png')}
        />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {categories.find(c => c.id === item.category)?.name || item.category}
          </Text>
        </View>
      </View>
      <View style={styles.articleContent}>
        <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.articleSummary} numberOfLines={2}>{item.summary}</Text>
        <View style={styles.articleMeta}>
          <Text style={styles.articleDate}>{item.published_date}</Text>
          <View style={styles.readTimeContainer}>
            <Ionicons name="time-outline" size={14} color="#888" />
            <Text style={styles.readTime}>{item.read_time}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FA5" />
        <Text style={styles.loadingText}>{t('knowledge.Loading_article')}</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('knowledge.Unabletoload')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setIsLoading(true)}>
          <Text style={styles.retryButtonText}>{t('knowledge.Try')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'บทความและเกร็ดความรู้',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#4A6FA5',
          },
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาบทความ..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#888"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item.id || (item.id === 'all' && !selectedCategory)
                  ? styles.categoryButtonActive
                  : {}
              ]}
              onPress={() => handleCategoryPress(item.id)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === item.id || (item.id === 'all' && !selectedCategory)
                    ? styles.categoryButtonTextActive
                    : {}
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Articles List */}
      {filteredArticles.length > 0 ? (
        <FlatList
          data={filteredArticles}
          renderItem={renderArticleItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.articlesList}
          initialNumToRender={4}
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={60} color="#ccc" />
          <Text style={styles.noResultsText}>ไม่พบบทความที่คุณค้นหา</Text>
          <TouchableOpacity
            style={styles.resetSearchButton}
            onPress={() => {
              setSearchText('');
              setSelectedCategory(null);
            }}
          >
            <Text style={styles.resetSearchButtonText}>ล้างการค้นหา</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#4A6FA5',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  articlesList: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleImageContainer: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  articleImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(74, 111, 165, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  articleContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  articleSummary: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleDate: {
    fontSize: 12,
    color: '#888',
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTime: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  resetSearchButton: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetSearchButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    color: '#4A6FA5',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  errorText: {
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ArticlesListPage;