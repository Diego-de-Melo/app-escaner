import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { settingsStorage, savedListStorage, generateProductCode } from '../../src/storage/ProductStorage';
import { useScanSession } from '../../src/context/ScanSession';
import { ProductFormData } from '../../src/types/Product';
import { createAIService } from '../../src/services/AILabelService';
import { exportSessionCSV } from '../../src/utils/ExcelExport';
import { AppButton, AppInput, AppModal, ModalAction, Card } from '../../components';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const ScanLine: React.FC = () => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      })
    ).start();
  }, [anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['20%', '80%'],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={scanLineStyles.container}>
      <Animated.View
        style={[
          scanLineStyles.line,
          { top: translateY, opacity },
        ]}
      />
    </View>
  );
};

const scanLineStyles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  line: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
});

const CornerBrackets: React.FC = () => (
  <View style={cornerStyles.container}>
    <View style={[cornerStyles.corner, cornerStyles.topLeft]} />
    <View style={[cornerStyles.corner, cornerStyles.topRight]} />
    <View style={[cornerStyles.corner, cornerStyles.bottomLeft]} />
    <View style={[cornerStyles.corner, cornerStyles.bottomRight]} />
  </View>
);

const cornerStyles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.primary,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 12 },
});

const ScannerScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const { items, addItem, removeItem, updateItemQuantity, clearSession, totalItems, totalQuantity } = useScanSession();

  const [extractedLabel, setExtractedLabel] = useState<ProductFormData | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [rawText, setRawText] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [listName, setListName] = useState('');
  const aiServiceRef = useRef<ReturnType<typeof createAIService> | null>(null);

  const initAIService = async () => {
    if (aiServiceRef.current) return;
    const storedSettings = await settingsStorage.get();
    const apiKey = storedSettings.openAIKey || '';
    if (apiKey) {
      aiServiceRef.current = createAIService(apiKey, storedSettings.openAIModel || 'gpt-4o-mini');
    }
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        await processLabelImage(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Nao foi possivel abrir a camera');
    }
  };

  const processLabelImage = async (imageUri: string) => {
    setAiProcessing(true);
    setAiError(null);
    try {
      await initAIService();
      if (!aiServiceRef.current) throw new Error('Configure sua API Key em Configuracoes');
      const extracted = await aiServiceRef.current.extractFromImage(imageUri);

      setRawText(extracted.rawText || '');
      setConfidence(extracted.confidence || 0);

      setExtractedLabel({
        description: extracted.description,
        model: extracted.model,
        color: extracted.color,
        voltage: extracted.voltage,
        brand: extracted.brand,
        sku: extracted.sku,
        quantity: 1,
        unit: 'UN',
      });
    } catch (error: any) {
      setAiError(error.message);
      Alert.alert('Erro na IA', error.message);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!extractedLabel) return;
    const code = generateProductCode(extractedLabel);
    const result = addItem(extractedLabel, code, confidence, rawText);

    if (result.isDuplicate) {
      Alert.alert('Produto duplicado', 'Produto ja esta na lista. Quantidade incrementada.');
    }

    resetState();
  };

  const handleSaveList = async () => {
    const name = listName.trim();
    if (!name) {
      Alert.alert('Erro', 'Digite um nome para a lista');
      return;
    }
    try {
      const now = new Date().toISOString();
      const products = items.map(item => ({
        id: item.id,
        code: item.code,
        description: item.description,
        model: item.model,
        color: item.color,
        voltage: item.voltage,
        brand: item.brand,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        createdAt: item.addedAt,
        updatedAt: now,
      }));

      await savedListStorage.save(name, products);
      await exportSessionCSV(items, name);
      clearSession();
      setListName('');
      setShowSaveModal(false);
    } catch (e) {
      Alert.alert('Erro ao salvar', String(e));
    }
  };

  const resetState = () => {
    setExtractedLabel(null);
    setAiError(null);
    setRawText('');
    setConfidence(0);
  };

  const confidencePercent = Math.round(confidence * 100);

  if (aiProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.processingContainer}>
          <View style={styles.processingPulse}>
            <View style={styles.processingRingOuter} />
            <View style={styles.processingRingInner} />
          </View>
          <Text style={styles.processingTitle}>Analisando etiqueta...</Text>
          <Text style={styles.processingSubtitle}>A IA esta processando a imagem</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (extractedLabel) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, isSmallScreen && styles.scrollContentSmall]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Etiqueta Analisada</Text>
            <Text style={styles.resultSubtitle}>Confira e edite antes de adicionar</Text>
          </View>

          <Card style={styles.confidenceCard}>
            <View style={styles.confidenceRow}>
              <Text style={styles.confidenceLabel}>Confianca da IA</Text>
              <Text
                style={[
                  styles.confidenceValue,
                  confidencePercent >= 70 ? styles.confHigh : confidencePercent >= 40 ? styles.confMid : styles.confLow,
                ]}
              >
                {confidencePercent}%
              </Text>
            </View>
          </Card>

          <Card style={styles.fieldsCard}>
            <View style={styles.inputRow}>
              <View style={styles.inputFull}>
                <AppInput
                  label="Descricao"
                  value={extractedLabel.description}
                  onChangeText={t => setExtractedLabel({ ...extractedLabel, description: t })}
                />
              </View>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <AppInput
                  label="Modelo"
                  value={extractedLabel.model}
                  onChangeText={t => setExtractedLabel({ ...extractedLabel, model: t })}
                />
              </View>
              <View style={styles.inputHalf}>
                <AppInput
                  label="Cor"
                  value={extractedLabel.color}
                  onChangeText={t => setExtractedLabel({ ...extractedLabel, color: t })}
                />
              </View>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <AppInput
                  label="Voltagem"
                  value={extractedLabel.voltage}
                  onChangeText={t => setExtractedLabel({ ...extractedLabel, voltage: t })}
                />
              </View>
              <View style={styles.inputHalf}>
                <AppInput
                  label="Marca"
                  value={extractedLabel.brand ?? ''}
                  onChangeText={t => setExtractedLabel({ ...extractedLabel, brand: t })}
                />
              </View>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <AppInput
                  label="SKU/EAN"
                  value={extractedLabel.sku ?? ''}
                  onChangeText={t => setExtractedLabel({ ...extractedLabel, sku: t })}
                />
              </View>
              <View style={styles.inputHalf}>
                <AppInput
                  label="Quantidade"
                  value={`${extractedLabel.quantity}`}
                  onChangeText={t => setExtractedLabel({ ...extractedLabel, quantity: parseInt(t) || 1 })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Card>

          {rawText ? (
            <Card style={styles.rawCard}>
              <Text style={styles.rawTitle}>Texto bruto</Text>
              <Text style={styles.rawText}>{rawText}</Text>
            </Card>
          ) : null}

          {aiError ? <Text style={styles.error}>{aiError}</Text> : null}

          <View style={styles.actions}>
            <AppButton title="Cancelar" onPress={resetState} variant="ghost" />
            <AppButton title="Adicionar a Lista" onPress={handleConfirmAdd} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.mainScroll, isSmallScreen && styles.mainScrollSmall]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.viewfinderArea}>
          <View style={styles.viewfinder}>
            <CornerBrackets />
            <View style={styles.viewfinderInner}>
              <View style={styles.gridOverlay} />
              <View style={styles.viewfinderCenter}>
                <Text style={styles.viewfinderIcon}>📷</Text>
                <Text style={styles.viewfinderText}>POSICIONE O CODIGO</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={openCamera}
          activeOpacity={0.7}
        >
          <View style={styles.scanButtonOuter}>
            <View style={styles.scanButtonInner}>
              <Text style={styles.scanButtonIcon}>🔍</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.scanHint}>Toque para escanear</Text>

        {totalItems > 0 ? (
          <View style={styles.sessionSection}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>Sessao Atual</Text>
              <View style={styles.sessionBadge}>
                <Text style={styles.sessionBadgeText}>{totalItems}</Text>
              </View>
            </View>

            {items.map((item) => (
              <View key={item.id} style={styles.sessionItem}>
                <View style={styles.sessionItemIcon}>
                  <Text style={styles.sessionItemIconText}>📦</Text>
                </View>
                <View style={styles.sessionItemLeft}>
                  <Text style={styles.sessionItemName} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text style={styles.sessionItemDetail} numberOfLines={1}>
                    {item.model} • {item.color} • {item.voltage}
                  </Text>
                </View>
                <View style={styles.sessionItemRight}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateItemQuantity(item.id, item.quantity - 1)}
                  >
                    <Text style={styles.qtyButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.sessionItemQty}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateItemQuantity(item.id, item.quantity + 1)}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sessionItemRemove}
                    onPress={() => removeItem(item.id)}
                  >
                    <Text style={styles.sessionItemRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.sessionActions}>
              <AppButton
                title="Limpar Sessao"
                onPress={() => {
                  Alert.alert('Limpar', 'Remover todos os itens da sessao?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Limpar', style: 'destructive', onPress: clearSession },
                  ]);
                }}
                variant="ghost"
              />
              <AppButton
                title="Salvar Lista"
                onPress={() => setShowSaveModal(true)}
              />
            </View>
          </View>
        ) : (
          <View style={styles.emptySession}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
            </View>
            <Text style={styles.emptyText}>Nenhum item escaneado</Text>
            <Text style={styles.emptyHint}>Escaneie etiquetas para criar uma lista</Text>
          </View>
        )}
      </ScrollView>

      <AppModal
        visible={showSaveModal}
        title="Salvar Lista"
        subtitle={`${totalItems} itens • ${totalQuantity} unidades`}
        onClose={() => { setShowSaveModal(false); setListName(''); }}
        footer={
          <>
            <ModalAction label="Cancelar" onPress={() => { setShowSaveModal(false); setListName(''); }} variant="ghost" />
            <ModalAction label="Salvar e Exportar" onPress={handleSaveList} />
          </>
        }
      >
        <TextInput
          style={styles.nameInput}
          placeholder="Nome da lista (ex: Estoque Sala 01)"
          placeholderTextColor={Colors.textDisabled}
          value={listName}
          onChangeText={setListName}
          autoFocus
        />
      </AppModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mainScroll: { padding: Spacing.xl, paddingBottom: 40 },
  mainScrollSmall: { padding: Spacing.lg, paddingBottom: 30 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 40 },
  scrollContentSmall: { padding: Spacing.lg, paddingBottom: 30 },

  viewfinderArea: { alignItems: 'center', marginBottom: Spacing.xxl },
  viewfinder: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  viewfinderInner: {
    ...StyleSheet.absoluteFillObject,
    margin: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    borderWidth: 0,
  },
  viewfinderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  viewfinderIcon: { fontSize: 32, opacity: 0.4 },
  viewfinderText: {
    color: Colors.primary,
    fontFamily: 'monospace',
    fontSize: Typography.sizes.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.5,
  },

  scanButton: {
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  scanButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.cyan40,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  scanButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cyan20,
  },
  scanButtonIcon: { fontSize: 24 },
  scanHint: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontFamily: 'monospace',
    fontSize: Typography.sizes.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing.xxxl,
  },

  emptySession: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.cyan10,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyIcon: { fontSize: 28 },
  emptyText: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  emptyHint: { fontSize: Typography.sizes.md, color: Colors.textMuted, textAlign: 'center' },

  sessionSection: { marginTop: Spacing.lg },
  sessionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg,
  },
  sessionTitle: {
    fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  sessionBadge: {
    backgroundColor: Colors.cyan10,
    borderWidth: 1,
    borderColor: Colors.borderActive,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  sessionBadgeText: {
    color: Colors.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    fontFamily: 'monospace',
  },
  sessionItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceCard, borderRadius: Radius.xl, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  sessionItemIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.cyan10, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  sessionItemIconText: { fontSize: 16 },
  sessionItemLeft: { flex: 1, minWidth: 0 },
  sessionItemName: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium, color: Colors.text, marginBottom: 2 },
  sessionItemDetail: { fontSize: Typography.sizes.sm, color: Colors.textMuted },
  sessionItemRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  qtyButton: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.surfaceLight,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  qtyButtonText: { color: Colors.text, fontSize: 16, fontWeight: Typography.weights.bold },
  sessionItemQty: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, color: Colors.primary, minWidth: 24, textAlign: 'center', fontFamily: 'monospace' },
  sessionItemRemove: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.dangerBg,
    justifyContent: 'center', alignItems: 'center',
  },
  sessionItemRemoveText: { color: Colors.danger, fontSize: 14, fontWeight: Typography.weights.bold },
  sessionActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },

  nameInput: {
    backgroundColor: Colors.surfaceLight, borderRadius: Radius.lg, padding: Spacing.lg,
    color: Colors.text, fontSize: Typography.sizes.base, borderWidth: 1, borderColor: Colors.border,
    fontFamily: 'monospace',
  },

  processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  processingPulse: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
  processingRingOuter: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.cyan20,
  },
  processingRingInner: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.cyan10,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  processingTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  processingSubtitle: { fontSize: Typography.sizes.md, color: Colors.textMuted, textAlign: 'center' },

  resultHeader: { marginBottom: Spacing.xl },
  resultTitle: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.text, marginBottom: Spacing.xs },
  resultSubtitle: { fontSize: Typography.sizes.md, color: Colors.textMuted },
  confidenceCard: { marginBottom: Spacing.xl },
  confidenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confidenceLabel: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  confidenceValue: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, fontFamily: 'monospace' },
  confHigh: { color: Colors.success },
  confMid: { color: Colors.warning },
  confLow: { color: Colors.danger },
  fieldsCard: { marginBottom: Spacing.xl },
  inputRow: { flexDirection: 'row', gap: Spacing.md },
  inputFull: { flex: 1 },
  inputHalf: { flex: 1 },
  rawCard: { marginBottom: Spacing.xl },
  rawTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'monospace' },
  rawText: { fontSize: Typography.sizes.sm, color: Colors.textMuted, lineHeight: 20 },
  error: { color: Colors.danger, fontSize: Typography.sizes.sm, marginBottom: Spacing.md, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
});

export default ScannerScreen;
