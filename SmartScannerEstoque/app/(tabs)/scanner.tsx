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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { settingsStorage, openAIApiKeyStorage, geminiApiKeyStorage, savedListStorage, generateProductCode } from '../../src/storage/ProductStorage';
import { useScanSession } from '../../src/context/ScanSession';
import { ProductFormData, ExtractedLabelData } from '../../src/types/Product';
import { ProductFormDataSchema, ListNameSchema } from '../../src/types/validation';
import { createAIService } from '../../src/services/AILabelService';
import { createGeminiService } from '../../src/services/GeminiService';
import { exportSessionCSV } from '../../src/utils/ExcelExport';
import { AppButton, AppInput, AppModal, ModalAction, Card } from '../../components';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Camera, Search, Package, X, Minus, Plus, Save, Trash2 } from 'lucide-react-native';

const ScannerScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const insets = useSafeAreaInsets();
  const { items, addItem, removeItem, updateItemQuantity, clearSession, totalItems, totalQuantity } = useScanSession();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const [extractedLabel, setExtractedLabel] = useState<ProductFormData | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [rawText, setRawText] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [listName, setListName] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const aiServiceRef = useRef<{ extractFromImage: (uri: string) => Promise<ExtractedLabelData> } | null>(null);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
    })();
  }, []);

  const initAIService = async () => {
    if (aiServiceRef.current) return;
    const storedSettings = await settingsStorage.get();
    const provider = storedSettings.aiProvider || 'gemini';

    if (provider === 'openai') {
      const apiKey = await openAIApiKeyStorage.get();
      if (apiKey) {
        aiServiceRef.current = createAIService(apiKey, storedSettings.openAIModel || 'gpt-4o-mini');
      }
    } else {
      const apiKey = await geminiApiKeyStorage.get();
      if (apiKey) {
        aiServiceRef.current = createGeminiService(apiKey, storedSettings.geminiModel || 'gemini-2.0-flash');
      }
    }
  };

  const handleScan = async () => {
    if (!cameraRef.current || !cameraReady || aiProcessing) return;
    setAiProcessing(true);
    setAiError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new Error('Nao foi possivel capturar a imagem');

      await initAIService();
      if (!aiServiceRef.current) throw new Error('Configure sua API Key em Configuracoes');
      const extracted = await aiServiceRef.current.extractFromImage(photo.uri);

      setRawText(extracted.rawText || '');
      setConfidence(extracted.confidence || 0);

      const labelData: ProductFormData = {
        description: extracted.description,
        model: extracted.model,
        color: extracted.color,
        voltage: extracted.voltage,
        brand: extracted.brand,
        sku: extracted.sku,
        quantity: 1,
        unit: 'UN',
      };

      const code = generateProductCode(labelData);
      const existingItem = items.find(item => item.code === code);
      setIsDuplicate(!!existingItem);
      setExtractedLabel(labelData);
    } catch (error: any) {
      setAiError(error.message);
      Alert.alert('Erro na IA', error.message);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!extractedLabel) return;

    const validation = ProductFormDataSchema.safeParse(extractedLabel);
    if (!validation.success) {
      Alert.alert('Dados invalidos', validation.error.issues[0].message);
      return;
    }

    const code = generateProductCode(extractedLabel);
    const result = addItem(extractedLabel, code, confidence, rawText);

    if (result.isDuplicate) {
      Alert.alert('Produto duplicado', 'Produto ja esta na lista. Quantidade incrementada.');
    }

    resetState();
  };

  const handleSaveList = async () => {
    const nameValidation = ListNameSchema.safeParse(listName);
    if (!nameValidation.success) {
      Alert.alert('Erro', nameValidation.error.issues[0].message);
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

      await savedListStorage.save(listName.trim(), products);
      await exportSessionCSV(items, listName.trim());
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
    setIsDuplicate(false);
  };

  const confidencePercent = Math.round(confidence * 100);

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Camera size={48} color={Colors.primary} strokeWidth={1.5} />
        <Text style={styles.permissionTitle}>Permissao da Camera</Text>
        <Text style={styles.permissionText}>
          Precisamos de acesso a camera para escanear etiquetas.
        </Text>
        <AppButton title="Conceder Permissao" onPress={requestPermission} />
      </View>
    );
  }

  // TELA: Resultado da analise AI
  if (extractedLabel) {
    return (
      <SafeAreaView style={styles.resultContainer} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.resultContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Etiqueta Analisada</Text>
            <Text style={styles.resultSubtitle}>Confira e edite antes de adicionar</Text>
          </View>

          {/* Conteudo scrollavel */}
          <ScrollView
            style={styles.resultScroll}
            contentContainerStyle={styles.resultScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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

            {isDuplicate && (
              <Card style={styles.duplicateCard}>
                <View style={styles.duplicateRow}>
                  <View style={styles.duplicateInfo}>
                    <Text style={styles.duplicateTitle}>Produto duplicado</Text>
                    <Text style={styles.duplicateText}>
                      Este produto ja esta na sessao. A quantidade sera incrementada.
                    </Text>
                  </View>
                </View>
              </Card>
            )}

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
                    onChangeText={t => {
                      const cleaned = t.replace(/[^0-9]/g, '');
                      setExtractedLabel({ ...extractedLabel, quantity: cleaned === '' ? 0 : parseInt(cleaned) });
                    }}
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
          </ScrollView>

          {/* Botoes FIXOS na parte inferior */}
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.resultBtnCancel} onPress={resetState}>
              <X size={18} color={Colors.textMuted} strokeWidth={2} />
              <Text style={styles.resultBtnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resultBtnConfirm} onPress={handleConfirmAdd}>
              <Plus size={18} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.resultBtnConfirmText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // TELA: Scanner com camera
  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Overlay escuro no topo */}
      <View pointerEvents="none" style={[styles.topOverlay, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>SmartScanner</Text>
          <Text style={styles.topCount}>
            {totalItems > 0 ? `${totalItems} item${totalItems > 1 ? 's' : ''} na sessao` : 'Pronto para escanear'}
          </Text>
        </View>
      </View>

      {/* Conteudo principal - AJUSTE AQUI: paddingTop = espaço topo, paddingBottom = espaço base (lupa sobe/desce) */}
      <View style={[styles.scannerContent, { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 335 }]}>
        {/* Meio: viewfinder + botao */}
        <View style={styles.scannerMiddle}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <View style={styles.viewfinderInner}>
              <Text style={styles.viewfinderText}>POSICIONE A ETIQUETA</Text>
            </View>
          </View>

          {/* Botao lupa */}
          <View style={styles.captureArea}>
            <TouchableOpacity
              style={[styles.captureButton, aiProcessing && styles.captureButtonDisabled]}
              onPress={handleScan}
              disabled={aiProcessing || !cameraReady}
              activeOpacity={0.7}
            >
              {aiProcessing ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : (
                <Search size={28} color={Colors.primary} strokeWidth={2} />
              )}
            </TouchableOpacity>
            <Text style={styles.captureHint}>
              {aiProcessing ? 'Analisando...' : 'Toque para escanear'}
            </Text>
          </View>
        </View>
      </View>

      {/* Sessao - AJUSTE AQUI: bottom = posicao da sessao de baixo pra cima */}
      <View style={[styles.bottomBar, { bottom: insets.bottom + 68 }]}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTitleRow}>
            <Package size={14} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.sessionTitle}>Sessao</Text>
          </View>
          {totalItems > 0 && (
            <View style={styles.sessionBadge}>
              <Text style={styles.sessionBadgeText}>{totalItems}</Text>
            </View>
          )}
        </View>

        {totalItems > 0 ? (
          <>
            <ScrollView
              style={styles.sessionScroll}
              showsVerticalScrollIndicator={false}
            >
              {items.slice(0, 4).map((item) => (
                <View key={item.id} style={styles.sessionItem}>
                  <View style={styles.sessionItemLeft}>
                    <Text style={styles.sessionItemName} numberOfLines={1}>
                      {item.description}
                    </Text>
                    <Text style={styles.sessionItemDetail} numberOfLines={1}>
                      {item.model} {item.color ? `• ${item.color}` : ''} {item.voltage ? `• ${item.voltage}` : ''}
                    </Text>
                  </View>
                  <View style={styles.sessionItemRight}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateItemQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={12} color={Colors.text} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.sessionItemQty}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateItemQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={12} color={Colors.text} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sessionItemRemove}
                      onPress={() => removeItem(item.id)}
                    >
                      <X size={12} color={Colors.danger} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Botoes de acao FIXOS */}
            <View style={styles.sessionActions}>
              <TouchableOpacity
                style={styles.sessionBtnClear}
                onPress={() => {
                  Alert.alert('Limpar', 'Remover todos os itens?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Limpar', style: 'destructive', onPress: clearSession },
                  ]);
                }}
              >
                <Trash2 size={14} color={Colors.textMuted} strokeWidth={2} />
                <Text style={styles.sessionBtnClearText}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sessionBtnSave}
                onPress={() => setShowSaveModal(true)}
              >
                <Save size={14} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.sessionBtnSaveText}>Salvar Lista</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptySession}>
            <Text style={styles.emptyText}>Escaneie etiquetas para comecar</Text>
          </View>
        )}
      </View>

      {/* MODAL: Salvar lista */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Permissao
  permissionContainer: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: Spacing.xl, gap: Spacing.lg,
  },
  permissionTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text, textAlign: 'center' },
  permissionText: { fontSize: Typography.sizes.md, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },

  // Overlay escuro no topo
  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
  },
  topBar: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingTop: Spacing.md, paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg, alignItems: 'center',
  },
  topTitle: {
    fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold,
    color: Colors.primary, fontFamily: 'monospace', letterSpacing: 2,
  },
  topCount: {
    fontSize: Typography.sizes.xs, color: Colors.textMuted,
    fontFamily: 'monospace', marginTop: 4,
  },

  // Conteudo principal
  scannerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerMiddle: {
    alignItems: 'center',
  },

  // Viewfinder
  viewfinder: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: Colors.primary },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  viewfinderInner: { ...StyleSheet.absoluteFillObject, margin: 10, justifyContent: 'center', alignItems: 'center' },
  viewfinderText: {
    color: Colors.primary, fontFamily: 'monospace',
    fontSize: Typography.sizes.xs, letterSpacing: 2,
    textTransform: 'uppercase', opacity: 0.6,
  },

  // Botao lupa - AJUSTE AQUI: marginTop = espaco entre quadrado e lupa
  captureArea: { alignItems: 'center', marginTop: 40 },
  captureButton: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  captureButtonDisabled: { opacity: 0.5 },
  captureHint: {
    fontSize: Typography.sizes.xs, color: Colors.textMuted,
    fontFamily: 'monospace', marginTop: Spacing.xs, letterSpacing: 1,
  },

  // Sessao (sempre visivel)
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
    maxHeight: 340,
  },
  sessionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sessionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  sessionTitle: {
    fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  sessionBadge: {
    backgroundColor: 'rgba(0,212,255,0.25)', borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.5)', borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  sessionBadgeText: {
    color: Colors.primary, fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold, fontFamily: 'monospace',
  },
  sessionScroll: { maxHeight: 140 },
  sessionItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.lg,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    marginBottom: 4,
  },
  sessionItemLeft: { flex: 1, minWidth: 0 },
  sessionItemName: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.text, marginBottom: 2 },
  sessionItemDetail: { fontSize: Typography.sizes.xs, color: Colors.textMuted },
  sessionItemRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyButton: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  sessionItemQty: {
    fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold,
    color: Colors.primary, minWidth: 24, textAlign: 'center', fontFamily: 'monospace',
  },
  sessionItemRemove: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,59,48,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Botoes da sessao
  sessionActions: {
    flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm,
  },
  sessionBtnClear: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  sessionBtnClearText: { fontSize: Typography.sizes.sm, color: Colors.textMuted, fontWeight: Typography.weights.medium },
  sessionBtnSave: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, backgroundColor: 'rgba(0,212,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.4)',
  },
  sessionBtnSaveText: { fontSize: Typography.sizes.sm, color: Colors.primary, fontWeight: Typography.weights.bold },
  emptySession: { alignItems: 'center', paddingVertical: Spacing.lg },
  emptyText: { fontSize: Typography.sizes.sm, color: Colors.textMuted },

  // TELA RESULTADO
  resultContainer: { flex: 1, backgroundColor: Colors.background },
  resultHeader: {
    paddingTop: Spacing.lg, paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surfaceCard, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  resultTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text, marginBottom: Spacing.xs },
  resultSubtitle: { fontSize: Typography.sizes.sm, color: Colors.textMuted },
  resultScroll: { flex: 1, minHeight: 0 },
  resultScrollContent: { padding: Spacing.xl, paddingBottom: Spacing.md },

  confidenceCard: { marginBottom: Spacing.md },
  confidenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confidenceLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  confidenceValue: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, fontFamily: 'monospace' },
  confHigh: { color: Colors.success },
  confMid: { color: Colors.warning },
  confLow: { color: Colors.danger },

  duplicateCard: { marginBottom: Spacing.md, borderColor: Colors.warning },
  duplicateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  duplicateInfo: { flex: 1 },
  duplicateTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.warning, marginBottom: 2 },
  duplicateText: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },

  fieldsCard: { marginBottom: Spacing.md },
  inputRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  inputFull: { flex: 1 },
  inputHalf: { flex: 1 },

  rawCard: { marginBottom: Spacing.md },
  rawTitle: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'monospace' },
  rawText: { fontSize: Typography.sizes.xs, color: Colors.textMuted, lineHeight: 18 },
  error: { color: Colors.danger, fontSize: Typography.sizes.xs, marginBottom: Spacing.md, textAlign: 'center' },

  // Botoes FIXOS do resultado
  resultActions: {
    flexDirection: 'row', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingBottom: 110, paddingTop: Spacing.md,
    backgroundColor: Colors.surfaceCard, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  resultBtnCancel: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: Colors.border,
  },
  resultBtnCancelText: { fontSize: Typography.sizes.sm, color: Colors.textMuted, fontWeight: Typography.weights.medium },
  resultBtnConfirm: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, backgroundColor: Colors.primary,
  },
  resultBtnConfirmText: { fontSize: Typography.sizes.sm, color: Colors.background, fontWeight: Typography.weights.bold },

  // Modal
  nameInput: {
    backgroundColor: Colors.surfaceLight, borderRadius: Radius.lg, padding: Spacing.lg,
    color: Colors.text, fontSize: Typography.sizes.base, borderWidth: 1, borderColor: Colors.border,
    fontFamily: 'monospace',
  },
});

export default ScannerScreen;
