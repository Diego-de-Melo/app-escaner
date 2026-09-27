import React, { createContext, useContext, useState, useCallback } from 'react';
import { ProductFormData } from '../types/Product';

export interface SessionItem {
  id: string;
  code: string;
  description: string;
  model: string;
  color: string;
  voltage: string;
  brand?: string;
  sku?: string;
  quantity: number;
  unit: string;
  confidence: number;
  rawText: string;
  addedAt: string;
}

interface ScanSessionContextData {
  items: SessionItem[];
  addItem: (data: ProductFormData, code: string, confidence: number, rawText: string) => { added: boolean; isDuplicate: boolean };
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  clearSession: () => void;
  totalItems: number;
  totalQuantity: number;
}

const ScanSessionContext = createContext<ScanSessionContextData>({} as ScanSessionContextData);

export const useScanSession = () => useContext(ScanSessionContext);

export const ScanSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<SessionItem[]>([]);

  const addItem = useCallback((
    data: ProductFormData,
    code: string,
    confidence: number,
    rawText: string,
  ) => {
    let isDuplicate = false;

    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.code === code);

      if (existingIndex >= 0) {
        isDuplicate = true;
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + data.quantity,
        };
        return updated;
      }

      const newItem: SessionItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        code,
        description: data.description,
        model: data.model,
        color: data.color,
        voltage: data.voltage,
        brand: data.brand,
        sku: data.sku,
        quantity: data.quantity,
        unit: data.unit,
        confidence,
        rawText,
        addedAt: new Date().toISOString(),
      };
      return [newItem, ...prev];
    });

    return { added: true, isDuplicate };
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateItemQuantity = useCallback((id: string, quantity: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0)
    );
  }, []);

  const clearSession = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ScanSessionContext.Provider
      value={{ items, addItem, removeItem, updateItemQuantity, clearSession, totalItems, totalQuantity }}
    >
      {children}
    </ScanSessionContext.Provider>
  );
};
