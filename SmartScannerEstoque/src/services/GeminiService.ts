import { GoogleGenAI } from '@google/genai';
import { ExtractedLabelData } from '../types/Product';

export interface GeminiService {
  extractFromImage(imageUri: string): Promise<ExtractedLabelData>;
}

const SYSTEM_PROMPT = `Voce e um especialista em leitura de etiquetas de produtos eletronicos brasileiros.
Analise a imagem da etiqueta e extraia as informacoes em JSON estruturado.

Campos a extrair:
- description: Descricao geral do produto (ex: "Lampada LED", "Interruptor", "Tomada", "Disjuntor")
- model: Modelo/codigo do produto (ex: "L-1234", "SMART-5000", "NT-20")
- color: Cor predominante (ex: "Branco", "Preto", "Cinza", "Branco/Preto")
- voltage: Voltagem (ex: "110V", "220V", "Bivolt", "127V", "24V", "12V")
- brand: Marca se visivel (ex: "Schneider", "Siemens", "Philips", "Tramontina")
- sku: Codigo de barras/SKU/EAN se houver na etiqueta
- confidence: Sua confianca na extracao (0.0 a 1.0)
- rawText: Todo texto legivel que voce viu na etiqueta

REGRAS:
- Se nao conseguir ler um campo, use string vazia ""
- Voltagem: normalize para "110V", "220V", "Bivolt", "12V", "24V", etc
- Cor: use nomes padrao em portugues
- Modelo: codigo alfanumerico do produto
- Seja preciso, nao invente informacoes

Retorne APENAS o JSON valido, sem markdown, sem explicacoes.`;

export const createGeminiService = (apiKey: string, model: string = 'gemini-3.5-flash'): GeminiService => {
  const ai = new GoogleGenAI({ apiKey });

  const extractFromImage = async (imageUri: string): Promise<ExtractedLabelData> => {
    const base64 = await uriToBase64(imageUri);

    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: 'user',
        parts: [
          { text: SYSTEM_PROMPT + '\n\nExtraia as informacoes desta etiqueta de produto:' },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64,
            },
          },
        ],
      }],
      config: {
        temperature: 0.1,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
      },
    });

    const content = response.text;

    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    try {
      let jsonStr = content.trim();

      // Remove markdown code blocks se presentes
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }

      // Tenta extrair JSON de dentro do texto
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);
      return {
        description: parsed.description || parsed.descricao || parsed.descripition || '',
        model: parsed.model || parsed.modelo || '',
        color: parsed.color || parsed.cor || '',
        voltage: parsed.voltage || parsed.voltagem || '',
        brand: parsed.brand || parsed.marca || '',
        sku: parsed.sku || parsed.ean || parsed.codigo || '',
        confidence: parsed.confidence || 0.5,
        rawText: parsed.rawText || parsed.textoBruto || '',
      };
    } catch (e) {
      throw new Error(`Erro ao parsear: ${content.substring(0, 300)}`);
    }
  };

  return { extractFromImage };
};

const uriToBase64 = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
