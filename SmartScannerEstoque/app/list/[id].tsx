import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { savedListStorage } from '../../src/storage/ProductStorage';
import { SavedList, Product } from '../../src/types/Product';
import { ProductFormDataSchema, QuantitySchema } from '../../src/types/validation';
import { exportSavedListCSV } from '../../src/utils/ExcelExport';
import { AppButton, AppInput, Card } from '../../components';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Package, Minus, Plus, Pencil, Trash2 } from 'lucide-react-native';

const ListDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  const [list, setList] = useState<SavedList | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Product>>({});

  useEffect(() => {
    if (id) {
      savedListStorage.getById(id).then(l => { if (l) setList(l); });
    }
  }, [id]);

  const handleUpdateQuantity = async (productId: string, delta: number) => {
    if (!list) return;
    const updatedProducts = list.products.map(p => {
      if (p.id === productId) {
        const newQty = Math.max(0, p.quantity + delta);
        const qtyValidation = QuantitySchema.safeParse(newQty);
        if (!qtyValidation.success) return p;
        return { ...p, quantity: newQty, updatedAt: new Date().toISOString() };
      }
      return p;
    }).filter(p => p.quantity > 0);

    await savedListStorage.updateProducts(list.id, updatedProducts);
    setList({ ...list, products: updatedProducts, updatedAt: new Date().toISOString() });
  };

  const handleStartEdit = (product: Product) => {
    setEditingProduct(product.id);
    setEditValues({
      description: product.description,
      model: product.model,
      color: product.color,
      voltage: product.voltage,
      brand: product.brand,
      sku: product.sku,
      quantity: product.quantity,
      unit: product.unit,
    });
  };

  const handleSaveEdit = async (productId: string) => {
    if (!list) return;

    const validation = ProductFormDataSchema.safeParse({
      description: editValues.description ?? '',
      model: editValues.model ?? '',
      color: editValues.color ?? '',
      voltage: editValues.voltage ?? '',
      brand: editValues.brand,
      sku: editValues.sku,
      quantity: editValues.quantity ?? 1,
      unit: editValues.unit ?? 'UN',
    });

    if (!validation.success) {
      Alert.alert('Dados invalidos', validation.error.issues[0].message);
      return;
    }

    const updatedProducts = list.products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          ...editValues,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    await savedListStorage.updateProducts(list.id, updatedProducts);
    setList({ ...list, products: updatedProducts, updatedAt: new Date().toISOString() });
    setEditingProduct(null);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditValues({});
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!list) return;
    Alert.alert('Excluir Produto', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const updatedProducts = list.products.filter(p => p.id !== productId);
          await savedListStorage.updateProducts(list.id, updatedProducts);
          setList({ ...list, products: updatedProducts, updatedAt: new Date().toISOString() });
        },
      },
    ]);
  };

  const handleExport = async () => {
    if (!list) return;
    try {
      await exportSavedListCSV(list.products, list.name);
    } catch (e) {
      Alert.alert('Erro ao exportar', String(e));
    }
  };

  if (!list) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const totalQty = list.products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isSmallScreen && styles.contentSmall]}
    >
      <View style={styles.headerSection}>
        <Text style={[styles.listName, isSmallScreen && styles.listNameSmall]}>{list.name}</Text>
        <View style={styles.headerMeta}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>
              {list.products.length} produtos
            </Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>
              {totalQty} unidades
            </Text>
          </View>
        </View>
        <Text style={styles.listDate}>
          Criado em {new Date(list.createdAt).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton title="Exportar CSV" onPress={handleExport} variant="secondary" />
      </View>

      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>Produtos</Text>

        {list.products.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum produto nesta lista</Text>
        ) : (
          list.products.map((product) => (
            <Card key={product.id} style={styles.productCard}>
              {editingProduct === product.id ? (
                <View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputFull}>
                      <AppInput
                        label="Descricao"
                        value={editValues.description ?? ''}
                        onChangeText={t => setEditValues({ ...editValues, description: t })}
                      />
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputHalf}>
                      <AppInput
                        label="Modelo"
                        value={editValues.model ?? ''}
                        onChangeText={t => setEditValues({ ...editValues, model: t })}
                      />
                    </View>
                    <View style={styles.inputHalf}>
                      <AppInput
                        label="Cor"
                        value={editValues.color ?? ''}
                        onChangeText={t => setEditValues({ ...editValues, color: t })}
                      />
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputHalf}>
                      <AppInput
                        label="Voltagem"
                        value={editValues.voltage ?? ''}
                        onChangeText={t => setEditValues({ ...editValues, voltage: t })}
                      />
                    </View>
                    <View style={styles.inputHalf}>
                      <AppInput
                        label="Marca"
                        value={editValues.brand ?? ''}
                        onChangeText={t => setEditValues({ ...editValues, brand: t })}
                      />
                    </View>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={styles.inputHalf}>
                      <AppInput
                        label="SKU/EAN"
                        value={editValues.sku ?? ''}
                        onChangeText={t => setEditValues({ ...editValues, sku: t })}
                      />
                    </View>
                    <View style={styles.inputHalf}>
                      <AppInput
                        label="Quantidade"
                        value={`${editValues.quantity ?? 1}`}
                        onChangeText={t => {
                          const cleaned = t.replace(/[^0-9]/g, '');
                          setEditValues({ ...editValues, quantity: cleaned === '' ? 0 : parseInt(cleaned) });
                        }}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <View style={styles.editActions}>
                    <AppButton title="Cancelar" onPress={handleCancelEdit} variant="ghost" />
                    <AppButton title="Salvar" onPress={() => handleSaveEdit(product.id)} />
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.productHeader}>
                    <View style={styles.productIcon}>
                      <Package size={16} color={Colors.primary} strokeWidth={2} />
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>{product.description}</Text>
                      <Text style={styles.productDetail} numberOfLines={1}>
                        {product.model} • {product.color} • {product.voltage}
                      </Text>
                      {product.brand ? (
                        <Text style={styles.productBrand}>{product.brand}</Text>
                      ) : null}
                    </View>
                    <View style={styles.productQty}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => handleUpdateQuantity(product.id, -1)}
                      >
                        <Minus size={14} color={Colors.text} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{product.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => handleUpdateQuantity(product.id, 1)}
                      >
                        <Plus size={14} color={Colors.text} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.productActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => handleStartEdit(product)}>
                      <Pencil size={14} color={Colors.primary} strokeWidth={2} />
                      <Text style={styles.editBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(product.id)}>
                      <Trash2 size={14} color={Colors.danger} strokeWidth={2} />
                      <Text style={styles.deleteBtnText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: 120 },
  contentSmall: { padding: Spacing.lg, paddingBottom: 100 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { color: Colors.textMuted, fontFamily: 'monospace' },
  headerSection: { marginBottom: Spacing.xl },
  listName: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.text, marginBottom: Spacing.sm },
  listNameSmall: { fontSize: Typography.sizes.xl },
  headerMeta: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  metaBadge: {
    backgroundColor: Colors.cyan10,
    borderWidth: 1,
    borderColor: Colors.borderActive,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  metaBadgeText: {
    color: Colors.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    fontFamily: 'monospace',
  },
  listDate: { fontSize: Typography.sizes.sm, color: Colors.textDisabled, fontFamily: 'monospace' },
  actions: { marginBottom: Spacing.xl },
  productsSection: { marginTop: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold,
    color: Colors.primary, marginBottom: Spacing.lg, textTransform: 'uppercase', letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  emptyText: { fontSize: Typography.sizes.md, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xxl },
  productCard: { marginBottom: Spacing.md },
  productHeader: { flexDirection: 'row', alignItems: 'center' },
  productIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.cyan10, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  productIconText: { fontSize: 16 },
  productInfo: { flex: 1 },
  productName: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.text, marginBottom: 2 },
  productDetail: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginBottom: 2 },
  productBrand: { fontSize: Typography.sizes.sm, color: Colors.textMuted },
  productQty: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceLight,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  qtyBtnText: { color: Colors.text, fontSize: 16, fontWeight: Typography.weights.bold },
  qtyValue: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.primary, minWidth: 30, textAlign: 'center', fontFamily: 'monospace' },
  productActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  editBtn: {
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border,
  },
  editBtnText: { color: Colors.primary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  deleteBtn: {
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.dangerBg, borderWidth: 1, borderColor: 'rgba(255,60,60,0.15)',
  },
  deleteBtnText: { color: Colors.danger, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  inputRow: { flexDirection: 'row', gap: Spacing.md },
  inputFull: { flex: 1 },
  inputHalf: { flex: 1 },
  editActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
});

export default ListDetailScreen;
