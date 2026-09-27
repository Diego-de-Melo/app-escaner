import { z } from 'zod';

export const ProductFormDataSchema = z.object({
  description: z.string().min(1, 'Descricao obrigatoria').max(200),
  model: z.string().max(50),
  color: z.string().max(50),
  voltage: z.string().max(20),
  brand: z.string().max(50).optional(),
  sku: z.string().max(50).optional(),
  quantity: z.number().int().min(1, 'Quantidade minima: 1').max(99999),
  unit: z.string().min(1).max(10),
});

export const ApiKeySchema = z.string().min(10, 'Chave muito curta. Verifique se copiou corretamente');

export const ListNameSchema = z.string().min(1, 'Nome obrigatorio').max(100).trim();

export const QuantitySchema = z.number().int().min(0).max(99999);

export type ProductFormDataInput = z.infer<typeof ProductFormDataSchema>;
