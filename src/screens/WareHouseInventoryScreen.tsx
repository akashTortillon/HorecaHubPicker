import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from '../utilities/Icon';
import { SVG_ICONS } from '../assets/icons/svg';
import api from '../api/axiosConfig';


interface Product {
  id: string;
  product_id: string;
  variant_id: string;
  product_code: string;
  product_name: string;
  variant_sku: string;
  category: string;
  department: string;
  in_stock_quantity: number;
  unit_name: string;
  sale_price: string;
  barcode: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const WarehouseInventory = () => {
  // ────────────────────────────────────────────────
  // State
  // ────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  // ────────────────────────────────────────────────
  // Fetch Functions
  // ────────────────────────────────────────────────
  const fetchCategories = async () => {
    try {
      const response = await api.get('picker/products/categories/');
      const data = response.data?.results?.data?.categories || [];
      setCategories(['All', ...data]);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchInventory = useCallback(
    async (pageNum: number, category: string = 'All', append = false) => {
      if (loadingMore || !hasMore) return;

      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        let url = `picker/products-variant-stocks/?page=${pageNum}&page_size=${pageSize}`;
        if (category !== 'All') {
          url += `&category=${encodeURIComponent(category)}`;
        }

        const response = await api.get(url);
        const items = response.data?.results?.data?.items || [];
        const totalCount = response.data?.results?.data?.total_count || 0;
        const totalPages = response.data?.results?.data?.total_pages || 1;

        const mapped: Product[] = items.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_code: item.product_code,
          product_name: item.product_name,
          variant_sku: item.variant_sku,
          category: item.category,
          department: item.department,
          in_stock_quantity: item.in_stock_quantity,
          unit_name: item.unit_name,
          sale_price: item.sale_price,
          barcode: item.barcode,
        }));

        if (append) {
          setProducts(prev => [...prev, ...mapped]);
          setFilteredProducts(prev => [...prev, ...mapped]);
        } else {
          setProducts(mapped);
          setFilteredProducts(mapped);
        }

        setHasMore(pageNum < totalPages && mapped.length > 0);
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [loadingMore, hasMore],
  );

  useEffect(() => {
    fetchCategories();
    fetchInventory(1, selectedCategory);
  }, []);

  // ────────────────────────────────────────────────
  // Handlers
  // ────────────────────────────────────────────────
  const applyFilters = (category: string) => {
    // setSelectedCategory(category);
    setPage(1);
    setHasMore(true);
    setIsFilterVisible(false);
    fetchInventory(1, category);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredProducts(products);
      return;
    }

    const lower = text.toLowerCase();
    const filtered = products.filter(
      p =>
        p.product_name.toLowerCase().includes(lower) ||
        p.variant_sku.toLowerCase().includes(lower) ||
        p.product_code.toLowerCase().includes(lower) ||
        p.barcode.toLowerCase().includes(lower),
    );

    setFilteredProducts(filtered);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchInventory(nextPage, selectedCategory, true);
    }
  };

  // ────────────────────────────────────────────────
  // Render Item
  // ────────────────────────────────────────────────
  const renderProduct = ({ item }: { item: Product }) => (
    <View
      style={[
        styles.card,
        item.category.toLowerCase().includes('accessories')
          ? styles.accessoriesCard
          : styles.electronicsCard,
      ]}
    >
      <View style={styles.cardInfo}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.category.toUpperCase()}</Text>
        </View>
        <Text style={styles.productName}>{item.product_name}</Text>
        <Text style={styles.skuText}>{item.variant_sku}</Text>
        <View style={styles.locationRow}>
          <Icon xml={SVG_ICONS.locationIcon} size={14} color="#64748B" />
          <Text style={styles.locationText}>{item.department}</Text>
        </View>
      </View>
      <View style={styles.stockBox}>
        <Text style={styles.liveText}>LIVE</Text>
        <Text style={styles.stockCount}>{item.in_stock_quantity}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon xml={SVG_ICONS.stocksIcon} size={28} color="#C62828" />
        <Text style={styles.headerTitle}>Warehouse Inventory</Text>
      </View>

      {/* Search + Filter Trigger */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Icon xml={SVG_ICONS.searchIcon} size={20} color="gray" />
          <TextInput
            placeholder="Search product..."
            style={styles.searchInput}
            placeholderTextColor={"gray"}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, isFilterVisible && styles.filterBtnActive]}
          onPress={() => setIsFilterVisible(!isFilterVisible)}
        >
          <Icon
            xml={SVG_ICONS.filterIcon}
            color={isFilterVisible ? 'white' : 'black'}
          />
        </TouchableOpacity>
      </View>

      {/* Scrollable Filter Sheet */}
      {isFilterVisible && (
        <View style={styles.filterSheet}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterLabel}>STOCK FILTERS</Text>
            <TouchableOpacity onPress={() => applyFilters('All')}>
              <Text style={styles.resetText}>RESET</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryRow}>
            <Icon xml={SVG_ICONS.tagIcon} size={16} color="#64748B" />
            <Text style={styles.categoryLabel}>CATEGORY</Text>
          </View>

          {/* Scrollable Categories */}
          <ScrollView
            style={styles.categoryScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <View style={styles.chipGroup}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => 
                     setSelectedCategory(cat)}
                  style={[
                    styles.chip,
                    selectedCategory === cat && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === cat && styles.chipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() =>
                applyFilters(selectedCategory)}
          >
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading or List */}
      {loading && page === 1 ? (
        <ActivityIndicator color="#C62828" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color="#C62828"
                style={{ marginVertical: 20 }}
              />
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No products found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

// ────────────────────────────────────────────────
// Styles (unchanged, just added empty state)
// ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 15,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 55,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '600' },
  filterBtn: {
    width: 55,
    height: 55,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: '#C62828', borderColor: '#C62828' },
  filterSheet: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  resetText: { color: '#C62828', fontWeight: '800' },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryLabel: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  chipGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 25,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#FEE2E2', borderColor: '#FEE2E2' },
  chipText: { fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: '#C62828' },
  applyBtn: {
    backgroundColor: '#0F172A',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  applyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    borderRadius: 25,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  electronicsCard: { backgroundColor: '#EEF2FF', borderColor: '#D1E3FF' },
  accessoriesCard: { backgroundColor: '#E6F9F3', borderColor: '#C2F0E3' },
  cardInfo: { flex: 1 },
  badge: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#64748B' },
  productName: { fontSize: 19, fontWeight: '900', color: '#1E293B' },
  skuText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
    marginVertical: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  locationText: { color: '#94A3B8', fontWeight: '700', fontSize: 13 },
  stockBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
    minWidth: 80,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 2,
  },
  stockCount: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 40,
  },
  categoryScroll: {
    maxHeight: SCREEN_HEIGHT * 0.4, // limits height to ~40% of screen
    marginBottom: 20,
  },
  categoryScrollContent: {
    paddingBottom: 10,
  },
});

export default WarehouseInventory;
