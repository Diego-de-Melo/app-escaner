import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import { SessionItem } from '../context/ScanSession';
import { Product } from '../types/Product';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCSV(products: { code: string; description: string; model: string; color: string; voltage: string; brand?: string; sku?: string; quantity: number; unit: string }[]): string {
  const headers = [
    'Codigo', 'Descricao', 'Modelo', 'Cor', 'Voltagem',
    'Marca', 'SKU/EAN', 'Quantidade', 'Unidade',
  ];

  const rows = products.map(p => [
    escapeCSV(p.code),
    escapeCSV(p.description),
    escapeCSV(p.model),
    escapeCSV(p.color),
    escapeCSV(p.voltage),
    escapeCSV(p.brand ?? ''),
    escapeCSV(p.sku ?? ''),
    String(p.quantity),
    escapeCSV(p.unit || 'UN'),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export const exportSessionCSV = async (items: SessionItem[], listName: string): Promise<void> => {
  const csv = buildCSV(items);
  const safeName = listName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 40);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
  const file = new File(Paths.cache, `${safeName}_${timestamp}.csv`);
  file.write(csv);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: `Exportar ${listName}`,
    UTI: 'public.comma-separated-values-text',
  });
};

export const exportSavedListCSV = async (products: Product[], listName: string): Promise<void> => {
  const csv = buildCSV(products);
  const safeName = listName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 40);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
  const file = new File(Paths.cache, `${safeName}_${timestamp}.csv`);
  file.write(csv);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: `Exportar ${listName}`,
    UTI: 'public.comma-separated-values-text',
  });
};
