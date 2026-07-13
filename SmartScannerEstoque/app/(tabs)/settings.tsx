import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  Alert,
  ScrollView,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { settingsStorage, AppSettings } from '../../src/storage/ProductStorage';
import { Card, AppButton, AppModal, ModalAction } from '../../components';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const ToggleSwitch: React.FC<{ value: boolean; onValueChange: (v: boolean) => void }> = ({
  value,
  onValueChange,
}) => (
  <TouchableOpacity
    onPress={() => onValueChange(!value)}
    activeOpacity={0.7}
    style={[toggleStyles.track, value && toggleStyles.trackActive]}
  >
    <View style={[toggleStyles.thumb, value && toggleStyles.thumbActive]} />
  </TouchableOpacity>
);

const toggleStyles = StyleSheet.create({
  track: {
    width: 48, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(90,122,154,0.3)',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  trackActive: {
    backgroundColor: 'rgba(0,212,255,0.8)',
  },
  thumb: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  thumbActive: {
    alignSelf: 'flex-end',
  },
});

const SettingsScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  const [settings, setSettings] = useState<AppSettings>({
    defaultUnit: 'UN', defaultLocation: 'Estoque Principal', autoIncrementQuantity: true,
    scanSoundEnabled: true, vibrationEnabled: true, openAIKey: '', openAIModel: 'gpt-4o-mini',
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await settingsStorage.get();
      setSettings(s);
      setApiKeyInput(s.openAIKey);
    })();
  }, []);

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const s = { ...settings, [key]: value };
    setSettings(s);
    await settingsStorage.set({ [key]: value });
  };

  const handleSaveApiKey = async () => {
    if (apiKeyInput.trim().startsWith('sk-')) {
      await updateSetting('openAIKey', apiKeyInput.trim());
      setShowApiKeyModal(false);
    } else {
      Alert.alert('Erro', 'Chave deve comecar com "sk-"');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.section, isSmallScreen && styles.sectionSmall]}>
          <Text style={styles.sectionTitle}>Inteligencia Artificial</Text>
          <Card>
            <TouchableOpacity
              style={styles.row}
              onPress={() => { setApiKeyInput(settings.openAIKey); setShowApiKeyModal(true); }}
              activeOpacity={0.7}
            >
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>API Key</Text>
                <Text style={styles.rowDesc}>
                  {settings.openAIKey
                    ? `••••${settings.openAIKey.slice(-4)}`
                    : 'Nao configurada'}
                </Text>
              </View>
              <Text style={styles.rowArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, { borderBottomWidth: 0 }]}
              onPress={() => Alert.alert('Modelo', 'Escolha:', [
                { text: 'gpt-4o-mini', onPress: () => updateSetting('openAIModel', 'gpt-4o-mini') },
                { text: 'gpt-4o', onPress: () => updateSetting('openAIModel', 'gpt-4o') },
                { text: 'Cancelar', style: 'cancel' },
              ])}
              activeOpacity={0.7}
            >
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Modelo GPT</Text>
                <Text style={styles.rowDesc}>
                  {settings.openAIModel === 'gpt-4o-mini' ? 'Rapido e economico' : 'Maior precisao'}
                </Text>
              </View>
              <View style={styles.rowValue}>
                <Text style={styles.rowValueText}>{settings.openAIModel}</Text>
                <Text style={styles.rowArrow}>›</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={[styles.section, isSmallScreen && styles.sectionSmall]}>
          <Text style={styles.sectionTitle}>Preferencias</Text>
          <Card>
            <TouchableOpacity
              style={styles.row}
              onPress={() => Alert.alert('Unidade', 'Escolha:', [
                { text: 'UN', onPress: () => updateSetting('defaultUnit', 'UN') },
                { text: 'KG', onPress: () => updateSetting('defaultUnit', 'KG') },
                { text: 'L', onPress: () => updateSetting('defaultUnit', 'L') },
                { text: 'M', onPress: () => updateSetting('defaultUnit', 'M') },
                { text: 'CX', onPress: () => updateSetting('defaultUnit', 'CX') },
                { text: 'PC', onPress: () => updateSetting('defaultUnit', 'PC') },
                { text: 'Cancelar', style: 'cancel' },
              ])}
              activeOpacity={0.7}
            >
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Unidade Padrao</Text>
                <Text style={styles.rowDesc}>Ao criar novos produtos</Text>
              </View>
              <View style={styles.rowValue}>
                <Text style={styles.rowValueText}>{settings.defaultUnit}</Text>
                <Text style={styles.rowArrow}>›</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.row}>
              <View style={styles.rowInfoFlex}>
                <Text style={styles.rowLabel}>Auto-incrementar</Text>
                <Text style={styles.rowDesc}>Qtd ao re-escanear</Text>
              </View>
              <ToggleSwitch
                value={settings.autoIncrementQuantity}
                onValueChange={v => updateSetting('autoIncrementQuantity', v)}
              />
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <View style={styles.rowInfoFlex}>
                <Text style={styles.rowLabel}>Vibracao</Text>
                <Text style={styles.rowDesc}>Ao escanear</Text>
              </View>
              <ToggleSwitch
                value={settings.vibrationEnabled}
                onValueChange={v => updateSetting('vibrationEnabled', v)}
              />
            </View>
          </Card>
        </View>

        <View style={[styles.section, isSmallScreen && styles.sectionSmall]}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Card>
            <Text style={styles.aboutTitle}>SmartScanner Estoque</Text>
            <Text style={styles.aboutVersion}>v2.0.0</Text>
            <Text style={styles.aboutText}>Escaneie etiquetas com IA e exporte como CSV. Escaneie, confirme, salve a lista.</Text>
          </Card>
        </View>
      </ScrollView>

      <AppModal
        visible={showApiKeyModal}
        title="OpenAI API Key"
        subtitle="Cole sua chave (sk-...)"
        onClose={() => setShowApiKeyModal(false)}
        footer={
          <>
            <ModalAction label="Cancelar" onPress={() => setShowApiKeyModal(false)} variant="ghost" />
            <ModalAction label="Salvar" onPress={handleSaveApiKey} />
          </>
        }
      >
        <TextInput
          style={styles.apiInput}
          placeholder="sk-..."
          placeholderTextColor={Colors.textDisabled}
          value={apiKeyInput}
          onChangeText={setApiKeyInput}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={!showApiKey}
        />
        <View style={styles.apiToggle}>
          <AppButton
            title={showApiKey ? 'Ocultar' : 'Mostrar'}
            onPress={() => setShowApiKey(!showApiKey)}
            variant="ghost"
          />
        </View>
        {settings.openAIKey ? (
          <AppButton
            title="Limpar Chave"
            onPress={async () => {
              await updateSetting('openAIKey', '');
              setApiKeyInput('');
              setShowApiKeyModal(false);
            }}
            variant="ghost"
          />
        ) : null}
      </AppModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingBottom: 40,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: 24,
  },
  sectionSmall: {
    marginHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowInfo: {
    flex: 1,
  },
  rowInfoFlex: {
    flex: 1,
  },
  rowLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  rowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rowValueText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  rowArrow: {
    fontSize: 20,
    color: Colors.textDisabled,
  },
  aboutTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  aboutVersion: {
    fontSize: Typography.sizes.sm,
    color: Colors.textDisabled,
    marginBottom: Spacing.md,
    fontFamily: 'monospace',
  },
  aboutText: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  apiInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    color: Colors.text,
    fontSize: Typography.sizes.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    fontFamily: 'monospace',
  },
  apiToggle: {
    marginBottom: Spacing.md,
  },
});

export default SettingsScreen;
