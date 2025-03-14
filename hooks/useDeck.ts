import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WordCard, Deck, StudyLog, ResponseType, UserSettings } from '@/types';
import { CardStorage, DeckStorage, LogStorage, SettingsStorage } from '@/services/storage';
import { calculateNextReviewDate, calculateTodayCards } from '@/utils/spaced-repetition';

/**
 * デッキ学習のためのカスタムフック
 * 
 * このフックは以下の機能を提供します:
 * - デッキとカードの読み込み
 * - 学習セッションの管理
 * - 回答の記録と次回の復習日の計算
 * - 学習進捗の追跡
 */
export function useDeck(deckId: string) {
  // 状態の定義
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<WordCard[]>([]); // デッキ内のすべてのカード
  const [studyCards, setStudyCards] = useState<WordCard[]>([]); // 今回の学習セッションで学習するカード
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState<WordCard | null>(null);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    again: 0,
    hard: 0,
    easy: 0
  });

  // デッキとカードの読み込み
  useEffect(() => {
    const loadDeckAndCards = async () => {
      setIsLoading(true);
      
      try {
        // ユーザー設定を読み込む
        const userSettings = await SettingsStorage.get();
        setSettings(userSettings);
        
        // デッキ情報を読み込む
        const deckData = await DeckStorage.getById(deckId);
        if (!deckData) {
          throw new Error(`デッキが見つかりません (ID: ${deckId})`);
        }
        setDeck(deckData);
        
        // デッキ内のカードを読み込む
        const allCards = await CardStorage.getAll();
        const deckCards = allCards.filter(card => deckData.cardIds.includes(card.id));
        setCards(deckCards);
        
        // 学習ログを読み込む
        const studyLogs = await LogStorage.getAll();
        setLogs(studyLogs);
        
        // 今日学習すべきカードを計算
        const { newCardIds, reviewCardIds } = calculateTodayCards(
          studyLogs,
          userSettings.newCardsPerDay,
          userSettings.reviewCardsPerDay,
          deckData.cardIds
        );
        
        // 新規カードとレビューカードを結合して、今回の学習セッションのカードを設定
        const todayCardIds = [...reviewCardIds, ...newCardIds];
        const todayCards = allCards.filter(card => todayCardIds.includes(card.id));
        
        // シャッフルして順番をランダムに
        const shuffledCards = [...todayCards].sort(() => Math.random() - 0.5);
        setStudyCards(shuffledCards);
        
        // 進捗状況を更新
        setProgress({
          completed: 0,
          total: shuffledCards.length
        });
        
        // 最初のカードを設定
        if (shuffledCards.length > 0) {
          setCurrentCard(shuffledCards[0]);
        }
      } catch (error) {
        console.error('デッキとカードの読み込みエラー:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDeckAndCards();
  }, [deckId]);

  // 回答を記録して次のカードに進む
  const handleResponse = useCallback(async (responseType: ResponseType, responseTime: number) => {
    if (!currentCard || !deck || !settings) return;
    
    try {
      // 次回の復習日を計算
      const cardLogs = logs.filter(log => log.cardId === currentCard.id);
      const nextReviewDate = calculateNextReviewDate(
        currentCard.id,
        responseType,
        cardLogs,
        {
          [ResponseType.WRONG]: settings.reviewIntervals.wrong * 60 * 1000,
          [ResponseType.AGAIN]: settings.reviewIntervals.again * 60 * 1000,
          [ResponseType.HARD]: settings.reviewIntervals.hard * 60 * 1000,
          [ResponseType.CORRECT]: settings.reviewIntervals.correct * 60 * 1000,
          [ResponseType.EASY]: settings.reviewIntervals.easy * 60 * 1000,
        },
        {
          [ResponseType.WRONG]: settings.reviewIntervals.wrongMultiplier,
          [ResponseType.AGAIN]: settings.reviewIntervals.againMultiplier,
          [ResponseType.HARD]: settings.reviewIntervals.hardMultiplier,
          [ResponseType.CORRECT]: settings.reviewIntervals.correctMultiplier,
          [ResponseType.EASY]: settings.reviewIntervals.easyMultiplier,
        }
      );
      
      // 学習ログを作成
      const studyLog: StudyLog = {
        id: uuidv4(),
        cardId: currentCard.id,
        deckId: deck.id,
        studiedAt: Date.now(),
        responseTime,
        responseType,
        nextReviewDate,
      };
      
      // 学習ログを保存
      await LogStorage.save(studyLog);
      
      // ローカルの学習ログも更新
      setLogs(prevLogs => [...prevLogs, studyLog]);
      
      // セッションの統計情報を更新
      setSessionStats(prev => {
        const newStats = { ...prev };
        switch (responseType) {
          case ResponseType.CORRECT:
            newStats.correct++;
            break;
          case ResponseType.WRONG:
            newStats.incorrect++;
            break;
          case ResponseType.AGAIN:
            newStats.again++;
            break;
          case ResponseType.HARD:
            newStats.hard++;
            break;
          case ResponseType.EASY:
            newStats.easy++;
            break;
        }
        return newStats;
      });
      
      // 次のカードに進む
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
      
      // 進捗状況を更新
      setProgress(prev => ({
        ...prev,
        completed: prev.completed + 1
      }));
      
      // まだカードが残っている場合は次のカードを設定
      if (nextIndex < studyCards.length) {
        setCurrentCard(studyCards[nextIndex]);
      } else {
        // 学習セッション終了
        setCurrentCard(null);
      }
    } catch (error) {
      console.error('回答処理エラー:', error);
    }
  }, [currentCard, currentCardIndex, deck, logs, settings, studyCards]);

  // 学習セッションをリセット
  const resetSession = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 今日学習すべきカードを再計算
      if (settings && deck) {
        const { newCardIds, reviewCardIds } = calculateTodayCards(
          logs,
          settings.newCardsPerDay,
          settings.reviewCardsPerDay,
          deck.cardIds
        );
        
        // 新規カードとレビューカードを結合
        const todayCardIds = [...reviewCardIds, ...newCardIds];
        const todayCards = cards.filter(card => todayCardIds.includes(card.id));
        
        // シャッフルして順番をランダムに
        const shuffledCards = [...todayCards].sort(() => Math.random() - 0.5);
        setStudyCards(shuffledCards);
        
        // 進捗状況をリセット
        setProgress({
          completed: 0,
          total: shuffledCards.length
        });
        
        // セッション統計をリセット
        setSessionStats({
          correct: 0,
          incorrect: 0,
          again: 0,
          hard: 0,
          easy: 0
        });
        
        // 最初のカードを設定
        setCurrentCardIndex(0);
        if (shuffledCards.length > 0) {
          setCurrentCard(shuffledCards[0]);
        } else {
          setCurrentCard(null);
        }
      }
    } catch (error) {
      console.error('セッションリセットエラー:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cards, deck, logs, settings]);

  return {
    deck,
    cards,
    studyCards,
    currentCard,
    isLoading,
    progress,
    sessionStats,
    handleResponse,
    resetSession,
    isSessionComplete: progress.completed === progress.total && progress.total > 0,
  };
}