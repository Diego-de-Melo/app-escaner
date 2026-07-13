import { ExtractedLabelData } from '../types/Product';

export interface AILabelService {
  extractFromImage(imageUri: string): Promise<ExtractedLabelData>;
}

export const createAIService = (apiKey: string, model: string = 'gpt-4o-mini'): AILabelService => {
  const API_URL = 'https://api.openai.com/v1/chat/completions';

  const SYSTEM_PROMPT = `Você é um especialista em leitura de etiquetas de produtos elétricos/eletrônicos brasileiros.
Analise a imagem da etiqueta e extraia as informações em JSON estruturado.

Campos a extrair:
- description: Descrição geral do produto (ex: "Lâmpada LED", "Interruptor", "Tomada", "Disjuntor")
- model: Modelo/código do produto (ex: "L-1234", "SMART-5000", "NT-20")
- color: Cor predominante (ex: "Branco", "Preto", "Cinza", "Branco/Preto")
- voltage: Voltagem (ex: "110V", "220V", "Bivolt", "127V", "24V", "12V")
- brand: Marca se visível (ex: "Schneider", "Siemens", "Philips", "Tramontina")
- sku: Código de barras/SKU/EAN se houver na etiqueta
- confidence: Sua confiança na extração (0.0 a 1.0)
- rawText: Todo texto legível que você viu na etiqueta

REGRAS:
- Se não conseguir ler um campo, use string vazia ""
- Voltagem: normalize para "110V", "220V", "Bivolt", "12V", "24V", etc
- Cor: use nomes padrão em português
- Modelo: código alfanumérico do produto
- Seja preciso, não invente informações

Retorne APENAS o JSON válido, sem markdown, sem explicações.`;

  const extractFromImage = async (imageUri: string): Promise<ExtractedLabelData> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extraia as informações desta etiqueta de produto:' },
              {
                type: 'image_url',
                image_url: {
                  url: imageUri.startsWith('data:') ? imageUri : `data:image/jpeg;base64,${await uriToBase64(imageUri)}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Erro API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        description: parsed.description || '',
        model: parsed.model || '',
        color: parsed.color || '',
        voltage: parsed.voltage || '',
        brand: parsed.brand || '',
        sku: parsed.sku || '',
        confidence: parsed.confidence || 0.5,
        rawText: parsed.rawText || '',
      };
    } catch (e) {
      throw new Error('Erro ao parsear resposta da IA');
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