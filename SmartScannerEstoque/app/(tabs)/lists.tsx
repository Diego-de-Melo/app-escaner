import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { savedListStorage } from '../../src/storage/ProductStorage';
import { SavedList } from '../../src/types/Product';
import { exportSavedListCSV } from '../../src/utils/ExcelExport';
import { AppButton, EmptyState } from '../../components';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const ListsScreen: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  const [lists, setLists] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLists = useCallback(async () => {
    setLoading(true);
    const data = await savedListStorage.getAll();
    setLists(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [loadLists])
  );

  const handleDelete = (list: SavedList) => {
    Alert.alert(
      'Excluir Lista',
      `Tem certeza que deseja excluir "${list.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await savedListStorage.delete(list.id);
            loadLists();
          },
        },
      ],
    );
  };

  const handleExport = async (list: SavedList) => {
    try {
      await exportSavedListCSV(list.products, list.name);
    } catch (e) {
      Alert.alert('Erro ao exportar', String(e));
    }
  };

  const renderList = ({ item }: { item: SavedList }) => {
    const totalQty = item.products.reduce((sum, p) => sum + p.quantity, 0);

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => router.push(`/list/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.listItemIcon}>
          <Text style={styles.listItemIconText}>📋</Text>
        </View>
        <View style={styles.listItemContent}>
          <Text style={styles.listItemName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.listItemMeta}>
            <Text style={styles.listItemMetaText}>
              {item.products.length} {item.products.length === 1 ? 'produto' : 'produtos'}
            </Text>
            <Text style={styles.listItemMetaDot}>•</Text>
            <Text style={styles.listItemMetaText}>{totalQty} und</Text>
          </View>
          <Text style={styles.listItemDate}>
            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>
        <View style={styles.listItemActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleExport(item)}>
            <Text style={styles.iconButtonText}>📥</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, styles.iconButtonDanger]} onPress={() => handleDelete(item)}>
            <Text style={styles.iconButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, isSmallScreen && styles.headerTitleSmall]}>
            Listas Salvas
          </Text>
          <Text style={styles.headerSubtitle}>
            {lists.length} {lists.length === 1 ? 'lista' : 'listas'}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{lists.length}</Text>
        </View>
      </View>

      {lists.length === 0 ? (
        <EmptyState
          title="Nenhuma lista salva"
          subtitle="Escaneie etiquetas e salve para aparecer aqui"
        />
      ) : (
        <FlatList
          data={lists}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderList}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textMuted, fontFamily: 'monospace' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl,
  },
  headerSmall: { padding: Spacing.lg },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.text,
  },
  headerTitleSmall: { fontSize: Typography.sizes.xl },
  headerSubtitle: {
    fontSize: Typography.sizes.md, color: Colors.textMuted, marginTop: 2,
    fontFamily: 'monospace',
  },
  headerBadge: {
    backgroundColor: Colors.cyan10,
    borderWidth: 1,
    borderColor: Colors.borderActive,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  headerBadgeText: {
    color: Colors.primary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    fontFamily: 'monospace',
  },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceCard, borderRadius: Radius.xl, padding: Spacing.lg,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  listItemIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.cyan10, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  listItemIconText: { fontSize: 18 },
  listItemContent: { flex: 1 },
  listItemName: {
    fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold,
    color: Colors.text, marginBottom: 4,
  },
  listItemMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 2 },
  listItemMetaText: { fontSize: Typography.sizes.sm, color: Colors.primary, fontFamily: 'monospace' },
  listItemMetaDot: { fontSize: Typography.sizes.sm, color: Colors.textDisabled },
  listItemDate: { fontSize: Typography.sizes.sm, color: Colors.textDisabled, fontFamily: 'monospace' },
  listItemActions: { flexDirection: 'row', gap: Spacing.sm },
  iconButton: {
    padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.surfaceLight,
    borderWidth: 1, borderColor: Colors.border,
  },
  iconButtonDanger: { backgroundColor: Colors.dangerBg, borderColor: 'rgba(255,60,60,0.15)' },
  iconButtonText: { fontSize: 16 },
});

export default ListsScreen;
