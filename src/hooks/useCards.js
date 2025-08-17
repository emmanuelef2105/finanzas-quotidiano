import { useState, useEffect } from 'react';
import { cardsAPI } from '../services/financeAPI';

export const useCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cardsAPI.getAll();
      setCards(response.data || []);
    } catch (err) {
      setError('Error al cargar las tarjetas');
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCardsByAccount = (accountId) => {
    return Array.isArray(cards) ? cards.filter(card => card.account_id === parseInt(accountId)) : [];
  };

  const getCreditCards = () => {
    return Array.isArray(cards) ? cards.filter(card => card.card_type === 'credit') : [];
  };

  const getDebitCards = () => {
    return Array.isArray(cards) ? cards.filter(card => card.card_type === 'debit') : [];
  };

  const getActiveCards = () => {
    return Array.isArray(cards) ? cards.filter(card => card.is_active !== false) : [];
  };

  const getTotalCreditLimit = () => {
    const creditCards = getCreditCards();
    return creditCards
      .filter(card => card.credit_limit)
      .reduce((total, card) => total + parseFloat(card.credit_limit), 0);
  };

  const getTotalCreditUsed = () => {
    const creditCards = getCreditCards();
    return creditCards
      .reduce((total, card) => total + parseFloat(card.current_balance || 0), 0);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  return {
    cards: getActiveCards(),
    allCards: Array.isArray(cards) ? cards : [],
    loading,
    error,
    fetchCards,
    getCardsByAccount,
    getCreditCards,
    getDebitCards,
    getActiveCards,
    getTotalCreditLimit,
    getTotalCreditUsed,
  };
};
