import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('₹');

  useEffect(() => {
    fetchCurrency();
  }, []);

  const fetchCurrency = async () => {
    try {
      const res = await axios.get('/api/settings');
      if (res.data && res.data.currency) {
        setCurrency(res.data.currency);
      }
    } catch (err) {
      console.error('Failed to load currency setting:', err);
    }
  };

  const updateCurrency = async (newSymbol) => {
    try {
      await axios.post('/api/settings', { key: 'currency', value: newSymbol });
      setCurrency(newSymbol);
    } catch (err) {
      console.error('Failed to update currency:', err);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: updateCurrency, refreshCurrency: fetchCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
