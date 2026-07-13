@echo off
set PROJECT_NAME=SmartScannerEstoque

echo Iniciando a configuracao do projeto %PROJECT_NAME%...

REM 1. Criar um novo projeto Expo com TypeScript usando create-expo-app
call npx create-expo-app %PROJECT_NAME% --template blank-typescript
cd %PROJECT_NAME%

REM 2. Instalar dependencias do Development Build
echo Instalando expo-dev-client...
call expo install expo-dev-client

REM 3. Instalar dependencias essenciais (agora com expo-camera para maior compatibilidade)
echo Instalando dependencias da camera (expo-camera), MMKV, ExcelJS e Haptics...
call expo install expo-camera
call npm install @react-native-firebase/app @react-native-firebase/ml-vision
call npm install react-native-mmkv
call npm install exceljs
call expo install expo-sharing
call expo install expo-haptics

REM 4. Configurar o app.json
echo Configurando app.json...
(
  echo {
  echo   "expo": {
  echo     "name": "%PROJECT_NAME%",
  echo     "slug": "%PROJECT_NAME%",
  echo     "version": "1.0.0",
  echo     "orientation": "portrait",
  echo     "icon": "./assets/icon.png",
  echo     "userInterfaceStyle": "light",
  echo     "splash": {
  echo       "image": "./assets/splash.png",
  echo       "resizeMode": "contain",
  echo       "backgroundColor": "#ffffff"
  echo     },
  echo     "assetBundlePatterns": [
  echo       "**/*"
  echo     ],
  echo     "ios": {
  echo       "supportsTablet": true,
  echo       "bundleIdentifier": "com.yourcompany.smartscannerestoque",
  echo       "infoPlist": {
  echo         "NSCameraUsageDescription": "Este aplicativo precisa de acesso a sua camera para escanear etiquetas de produtos."
  echo       }
  echo     },
  echo     "android": {
  echo       "adaptiveIcon": {
  echo         "foregroundImage": "./assets/adaptive-icon.png",
  echo         "backgroundColor": "#ffffff"
  echo       },
  echo       "package": "com.yourcompany.smartscannerestoque",
  echo       "permissions": [
  echo         "android.permission.CAMERA"
  echo       ]
  echo     },
  echo     "web": {
  echo       "favicon": "./assets/favicon.png"
  echo     },
  echo     "plugins": [
  echo       "expo-camera",
  echo       "@react-native-firebase/app",
  echo       "@react-native-firebase/ml-vision"
  echo     ]
  echo   }
  echo }
) > app.json

REM 5. Criar o arquivo App.tsx
echo Criando App.tsx...
(
  echo import React, { useState, useEffect, useRef, useCallback } from 'react';
  echo import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
  echo import { Camera } from 'expo-camera'; // Usando expo-camera
  echo import { useIsFocused } from '@react-navigation/native';
  echo import { MMKV } from 'react-native-mmkv';
  echo import *as Haptics from 'expo-haptics';
  echo import *as FileSystem from 'expo-file-system';
  echo import *as Sharing from 'expo-sharing';
  echo import ExcelJS from 'exceljs';
  echo 
  echo // Placeholder para o módulo de OCR. Em um ambiente de produção, isso seria a integracao com ML Kit.
  echo // Por enquanto, simula a extracao de dados.
  echo const mockOCR = async (photoUri: string): Promise<{ modelo: string; cor: string; descricao: string; tensao: string } ^| null> => {
  echo   return new Promise(resolve => {
  echo     setTimeout(() => {
  echo       const mockProducts = [
  echo         { modelo: 'MDR-ZX110', cor: 'Preto', descricao: 'Fone de Ouvido Bluetooth', tensao: '110V' },
  echo         { modelo: 'Samsung-A54', cor: 'Branco', descricao: 'Smartphone', tensao: '220V' },
  echo         { modelo: 'Echo-Dot', cor: 'Cinza', descricao: 'Smart Speaker', tensao: 'Bivolt' },
  echo         { modelo: 'Kindle-Paperwhite', cor: 'Preto', descricao: 'E-reader', tensao: 'Bivolt' },
  echo       ];
  echo       const randomIndex = Math.floor(Math.random() * mockProducts.length);
  echo       resolve(mockProducts[randomIndex]);
  echo     }, 500); // Simula um atraso de processamento de 500ms
  echo   });
  echo };
  echo 
  echo // Configuracao do MMKV
  echo const storage = new MMKV();
  echo 
  echo interface Product {
  echo   modelo: string;
  echo   cor: string;
  echo   descricao: string;
  echo   tensao: string;
  echo   quantidade: number;
  echo }
  echo 
  echo export default function App() {
  echo   const [hasPermission, setHasPermission] = useState<boolean ^| null>(null);
  echo   const cameraRef = useRef<Camera>(null);
  echo   const isFocused = useIsFocused();
  echo 
  echo   const [scannedProducts, setScannedProducts] = useState<Product[]>([]);
  echo   const [isScanning, setIsScanning] = useState(false);
  echo 
  echo   useEffect(() => {
  echo     (async () => {
  echo       const { status } = await Camera.requestCameraPermissionsAsync();
  echo       setHasPermission(status === 'granted');
  echo     })();
  echo 
  echo     // Carregar produtos do MMKV ao iniciar
  echo     loadProductsFromStorage();
  echo   }, []);
  echo 
  echo   const loadProductsFromStorage = useCallback(() => {
  echo     try {
  echo       const keys = storage.getAllKeys();
  echo       const products: Product[] = [];
  echo       keys.forEach(key => {
  echo         const productString = storage.getString(key);
  echo         if (productString) {
  echo           products.push(JSON.parse(productString));
  echo         }
  echo       });
  echo       setScannedProducts(products.sort((a, b) => b.quantidade - a.quantidade)); // Ordena por quantidade para mostrar os mais escaneados no topo
  echo     } catch (error) {
  echo       console.error('Erro ao carregar produtos do MMKV:', error);
  echo     }
  echo   }, []);
  echo 
  echo   const processScannedProduct = useCallback(async (productData: Omit<Product, 'quantidade'>) => {
  echo     const { modelo, cor, descricao, tensao } = productData;
  echo     const mmkvKey = `${modelo}_${cor}`;
  echo 
  echo     try {
  echo       const existingProductString = storage.getString(mmkvKey);
  echo       let updatedProduct: Product;
  echo 
  echo       if (existingProductString) {
  echo         let existingProduct: Product = JSON.parse(existingProductString);
  echo         existingProduct.quantidade += 1;
  echo         updatedProduct = existingProduct;
  echo       } else {
  echo         const newProduct: Product = {
  echo           modelo,
  echo           cor,
  echo           descricao,
  echo           tensao,
  echo           quantidade: 1,
  echo         };
  echo         updatedProduct = newProduct;
  echo       }
  echo       storage.set(mmkvKey, JSON.stringify(updatedProduct));
  echo       loadProductsFromStorage(); // Recarrega a lista para atualizar a UI
  echo       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  echo     } catch (error) {
  echo       console.error('Erro ao processar produto no MMKV:', error);
  echo       Alert.alert('Erro', 'Nao foi possivel processar o produto.');
  echo       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  echo     }
  echo   }, [loadProductsFromStorage]);
  echo 
  echo   const exportToExcel = useCallback(async () => {
  echo     try {
  echo       if (scannedProducts.length === 0) {
  echo         Alert.alert("Nenhum Produto", "Nao ha produtos escaneados para exportar.");
  echo         return;
  echo       }
  echo 
  echo       const workbook = new ExcelJS.Workbook();
  echo       const worksheet = workbook.addWorksheet("Estoque SmartScanner");
  echo 
  echo       // Adicionar cabecalhos
  echo       worksheet.columns = [
  echo         { header: "Modelo", key: "modelo", width: 20 },
  echo         { header: "Cor", key: "cor", width: 15 },
  echo         { header: "Descricao", key: "descricao", width: 30 },
  echo         { header: "Tensao", key: "tensao", width: 10 },
  echo         { header: "Quantidade", key: "quantidade", width: 15 },
  echo       ];
  echo 
  echo       // Adicionar dados
  echo       scannedProducts.forEach(product => {
  echo         worksheet.addRow(product);
  echo       });
  echo 
  echo       // Gerar o buffer do Excel
  echo       const buffer = await workbook.xlsx.writeBuffer();
  echo       const fileName = `SmartScanner_Estoque_${new Date().toISOString().split("T")[0]}.xlsx`;
  echo       const filePath = `${FileSystem.cacheDirectory}${fileName}`;
  echo 
  echo       // Salvar o arquivo temporariamente
  echo       await FileSystem.writeAsStringAsync(filePath, buffer.toString("base64"), {
  echo         encoding: FileSystem.EncodingType.Base64,
  echo       });
  echo 
  echo       // Compartilhar o arquivo
  echo       if (await Sharing.isAvailableAsync()) {
  echo         await Sharing.shareAsync(filePath, {
  echo           mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  echo           UTI: "com.microsoft.excel.xlsx",
  echo         });
  echo       } else {
  echo         Alert.alert("Erro", "Compartilhamento nao disponivel neste dispositivo.");
  echo       }
  echo 
  echo     } catch (error) {
  echo       console.error("Erro ao exportar para Excel:", error);
  echo       Alert.alert("Erro", "Nao foi possivel exportar a planilha.");
  echo     }
  echo   }, [scannedProducts]);
  echo 
  echo   const handleScanButtonPress = useCallback(async () => {
  echo     if (cameraRef.current && !isScanning) {
  echo       setIsScanning(true);
  echo       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Feedback tatil
  echo 
  echo       try {
  echo         const photo = await cameraRef.current.takePictureAsync(); // Captura a foto com expo-camera
  echo         const ocrResult = await mockOCR(photo.uri); // Passa a URI da foto para o mockOCR
  echo 
  echo         if (ocrResult) {
  echo           console.log('OCR Result:', ocrResult);
  echo           await processScannedProduct(ocrResult);
  echo         } else {
  echo           Alert.alert('Erro de OCR', 'Nao foi possivel extrair dados da etiqueta.');
  echo           Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  echo         }
  echo       } catch (error) {
  echo         console.error('Erro ao escanear:', error);
  echo         Alert.alert('Erro', 'Ocorreu um erro durante o escaneamento.');
  echo         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  echo       } finally {
  echo         setIsScanning(false);
  echo       }
  echo     }
  echo   }, [isScanning, processScannedProduct]);
  echo 
  echo   // Renderizacao da camera
  echo   if (hasPermission === null) {
  echo     return <View />;
  echo   }
  echo   if (hasPermission === false) {
  echo     return (
  echo       <View style={styles.container}>
  echo         <Text>Acesso a camera negado.</Text>
  echo       </View>
  echo     );
  echo   }
  echo 
  echo   return (
  echo     <View style={styles.container}>
  echo       {/* Area da Camera (50% da tela) */}
  echo       <View style={styles.cameraContainer}>
  echo         <Camera
  echo           ref={cameraRef}
  echo           style={StyleSheet.absoluteFill}
  echo           type={Camera.Constants.Type.back}
  echo           // Nao ha propriedade 'device' ou 'isActive' como em react-native-vision-camera
  echo           // A camera esta ativa se o componente e montado e tem permissao
  echo         />
  echo         <View style={styles.overlay} />
  echo         <View style={styles.scanLine} />
  echo       </View>
  echo 
  echo       {/* Botao Escanear Etiqueta */}
  echo       <TouchableOpacity
  echo         style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
  echo         onPress={handleScanButtonPress}
  echo         disabled={isScanning}
  echo       >
  echo         <Text style={styles.scanButtonText}>{isScanning ? 'Escaneando...' : 'Escanear Etiqueta'}</Text>
  echo       </TouchableOpacity>
  echo 
  echo       {/* Area da Lista de Produtos (50% da tela) */}
  echo       <View style={styles.productListContainer}>
  echo         <FlatList
  echo           data={scannedProducts}
  echo           keyExtractor={(item, index) => `${item.modelo}-${item.cor}-${index}`}
  echo           renderItem={({ item }) => (
  echo             <View style={styles.productItem}>
  echo               <Text style={styles.productItemText}>^|Qtd: {item.quantidade}^| - {item.modelo} ({item.cor}) - {item.tensao}</Text>
  echo             </View>
  echo           )}
  echo           ListEmptyComponent={<Text style={styles.emptyListText}>Nenhum produto escaneado ainda.</Text>}
  echo         />
  echo       </View>
  echo 
  echo       {/* Botao Exportar para Excel (Rodape) */}
  echo       <TouchableOpacity
  echo         style={styles.exportButton}
  echo         onPress={exportToExcel}
  echo       >
  echo         <Text style={styles.exportButtonText}>📊 Gerar e Exportar Planilha Excel</Text>
  echo       </TouchableOpacity>
  echo     </View>
  echo   );
  echo }
  echo 
  echo const styles = StyleSheet.create({
  echo   container: {
  echo     flex: 1,
  echo     backgroundColor: '#f0f0f0',
  echo   },
  echo   cameraContainer: {
  echo     flex: 1,
  echo     backgroundColor: 'black',
  echo     position: 'relative',
  echo   },
  echo   overlay: {
  echo     ...StyleSheet.absoluteFillObject,
  echo     backgroundColor: 'rgba(0,0,0,0.3)', // Escurece um pouco a camera para o overlay
  echo   },
  echo   scanLine: {
  echo     position: 'absolute',
  echo     top: '50%',
  echo     left: 0,
  echo     right: 0,
  echo     height: 2,
  echo     backgroundColor: 'red',
  echo     marginTop: -1, // Centraliza a linha
  echo   },
  echo   scanButton: {
  echo     position: 'absolute',
  echo     alignSelf: 'center',
  echo     bottom: '50%', // Posiciona no centro da tela
  echo     marginBottom: -30, // Ajuste para centralizar verticalmente
  echo     width: 150,
  echo     height: 60,
  echo     borderRadius: 30,
  echo     backgroundColor: '#4CAF50',
  echo     justifyContent: 'center',
  echo     alignItems: 'center',
  echo     elevation: 5,
  echo     zIndex: 10,
  echo   },
  echo   scanButtonDisabled: {
  echo     backgroundColor: '#A5D6A7',
  echo   },
  echo   scanButtonText: {
  echo     color: 'white',
  echo     fontSize: 18,
  echo     fontWeight: 'bold',
  echo   },
  echo   productListContainer: {
  echo     flex: 1,
  echo     backgroundColor: 'white',
  echo     paddingTop: 10,
  echo   },
  echo   productItem: {
  echo     paddingVertical: 10,
  echo     paddingHorizontal: 15,
  echo     borderBottomWidth: 1,
  echo     borderBottomColor: '#eee',
  echo   },
  echo   productItemText: {
  echo     fontSize: 16,
  echo     color: '#333',
  echo   },
  echo   emptyListText: {
  echo     textAlign: 'center',
  echo     marginTop: 20,
  echo     fontSize: 16,
  echo     color: '#777',
  echo   },
  echo   exportButton: {
  echo     backgroundColor: '#2196F3',
  echo     paddingVertical: 15,
  echo     alignItems: 'center',
  echo     justifyContent: 'center',
  echo   },
  echo   exportButtonText: {
  echo     color: 'white',
  echo     fontSize: 18,
  echo     fontWeight: 'bold',
  echo   },
  echo });
) > App.tsx

echo Projeto %PROJECT_NAME% configurado com sucesso!
echo.
echo Agora, para gerar o aplicativo instalavel para o seu celular, siga estes passos:
echo.
echo 1. Certifique-se de ter o EAS CLI instalado globalmente: npm install -g eas-cli
echo 2. Navegue ate a pasta do projeto: cd %PROJECT_NAME%
echo 3. Inicie o processo de build para Android (ou iOS):
echo    eas build --profile development --platform android
echo    REM Para iOS, voce precisara de uma conta de desenvolvedor Apple e um Mac:
echo    REM eas build --profile development --platform ios
echo.
echo Apos o build ser concluido, voce recebera um link ou QR code para baixar e instalar o aplicativo em seu dispositivo.
echo.
pause
