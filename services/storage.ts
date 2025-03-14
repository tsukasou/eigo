import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordCard, Deck, StudyLog, UserSettings, ResponseType } from '@/types';

/**
 * ストレージキーの定義
 */
const STORAGE_KEYS = {
  CARDS: 'eigo_cards',
  DECKS: 'eigo_decks',
  STUDY_LOGS: 'eigo_study_logs',
  USER_SETTINGS: 'eigo_user_settings',
  LAST_SCREEN: 'eigo_last_screen',
};

/**
 * デッキのCRUD操作
 */
export const DeckStorage = {
  /**
   * すべてのデッキを取得する
   * @returns デッキの配列
   */
  async getAll(): Promise<Deck[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.DECKS);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('デッキ取得エラー:', error);
      return [];
    }
  },

  /**
   * IDでデッキを取得する
   * @param id デッキID
   * @returns デッキオブジェクト、存在しない場合はnull
   */
  async getById(id: string): Promise<Deck | null> {
    try {
      const decks = await this.getAll();
      return decks.find(deck => deck.id === id) || null;
    } catch (error) {
      console.error(`デッキ(ID:${id})取得エラー:`, error);
      return null;
    }
  },

  /**
   * デッキを保存する（新規作成または更新）
   * @param deck デッキオブジェクト
   * @returns 成功した場合はtrue
   */
  async save(deck: Deck): Promise<boolean> {
    try {
      const decks = await this.getAll();
      const now = Date.now();
      
      // 既存のデッキを検索
      const index = decks.findIndex(d => d.id === deck.id);
      
      if (index >= 0) {
        // 既存のデッキを更新
        decks[index] = {
          ...deck,
          updatedAt: now,
        };
      } else {
        // 新規デッキを追加
        decks.push({
          ...deck,
          createdAt: now,
          updatedAt: now,
        });
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
      return true;
    } catch (error) {
      console.error('デッキ保存エラー:', error);
      return false;
    }
  },

  /**
   * デッキを削除する
   * @param id デッキID
   * @returns 成功した場合はtrue
   */
  async remove(id: string): Promise<boolean> {
    try {
      const decks = await this.getAll();
      const filteredDecks = decks.filter(deck => deck.id !== id);
      
      if (filteredDecks.length === decks.length) {
        // 削除対象のデッキが見つからなかった
        return false;
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(filteredDecks));
      return true;
    } catch (error) {
      console.error(`デッキ(ID:${id})削除エラー:`, error);
      return false;
    }
  },

  /**
   * デッキにカードを追加する
   * @param deckId デッキID
   * @param cardIds 追加するカードIDの配列
   * @returns 成功した場合はtrue
   */
  async addCards(deckId: string, cardIds: string[]): Promise<boolean> {
    try {
      const deck = await this.getById(deckId);
      if (!deck) return false;
      
      // 重複を除いてカードを追加
      const uniqueCardIds = new Set([...deck.cardIds, ...cardIds]);
      deck.cardIds = Array.from(uniqueCardIds);
      deck.updatedAt = Date.now();
      
      return await this.save(deck);
    } catch (error) {
      console.error(`デッキ(ID:${deckId})へのカード追加エラー:`, error);
      return false;
    }
  },

  /**
   * デッキからカードを削除する
   * @param deckId デッキID
   * @param cardIds 削除するカードIDの配列
   * @returns 成功した場合はtrue
   */
  async removeCards(deckId: string, cardIds: string[]): Promise<boolean> {
    try {
      const deck = await this.getById(deckId);
      if (!deck) return false;
      
      // 指定されたカードを除外
      const cardIdSet = new Set(cardIds);
      deck.cardIds = deck.cardIds.filter(id => !cardIdSet.has(id));
      deck.updatedAt = Date.now();
      
      return await this.save(deck);
    } catch (error) {
      console.error(`デッキ(ID:${deckId})からのカード削除エラー:`, error);
      return false;
    }
  },
};

/**
 * 学習ログのCRUD操作
 */
export const LogStorage = {
  /**
   * すべての学習ログを取得する
   * @returns 学習ログの配列
   */
  async getAll(): Promise<StudyLog[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.STUDY_LOGS);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('学習ログ取得エラー:', error);
      return [];
    }
  },

  /**
   * カードIDに関連する学習ログを取得する
   * @param cardId カードID
   * @returns 学習ログの配列
   */
  async getByCardId(cardId: string): Promise<StudyLog[]> {
    try {
      const logs = await this.getAll();
      return logs
        .filter(log => log.cardId === cardId)
        .sort((a, b) => b.studiedAt - a.studiedAt); // 新しい順にソート
    } catch (error) {
      console.error(`カード(ID:${cardId})の学習ログ取得エラー:`, error);
      return [];
    }
  },

  /**
   * デッキIDに関連する学習ログを取得する
   * @param deckId デッキID
   * @returns 学習ログの配列
   */
  async getByDeckId(deckId: string): Promise<StudyLog[]> {
    try {
      const logs = await this.getAll();
      return logs
        .filter(log => log.deckId === deckId)
        .sort((a, b) => b.studiedAt - a.studiedAt); // 新しい順にソート
    } catch (error) {
      console.error(`デッキ(ID:${deckId})の学習ログ取得エラー:`, error);
      return [];
    }
  },

  /**
   * 学習ログを保存する
   * @param log 学習ログオブジェクト
   * @returns 成功した場合はtrue
   */
  async save(log: StudyLog): Promise<boolean> {
    try {
      const logs = await this.getAll();
      logs.push(log);
      
      await AsyncStorage.setItem(STORAGE_KEYS.STUDY_LOGS, JSON.stringify(logs));
      return true;
    } catch (error) {
      console.error('学習ログ保存エラー:', error);
      return false;
    }
  },

  /**
   * 指定した日付範囲の学習ログを取得する
   * @param startDate 開始日（タイムスタンプ）
   * @param endDate 終了日（タイムスタンプ）
   * @returns 学習ログの配列
   */
  async getByDateRange(startDate: number, endDate: number): Promise<StudyLog[]> {
    try {
      const logs = await this.getAll();
      return logs.filter(log => 
        log.studiedAt >= startDate && log.studiedAt <= endDate
      );
    } catch (error) {
      console.error('日付範囲での学習ログ取得エラー:', error);
      return [];
    }
  },

  /**
   * 今日の学習ログを取得する
   * @returns 今日の学習ログの配列
   */
  async getToday(): Promise<StudyLog[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
    
    return this.getByDateRange(startOfDay, endOfDay);
  },
};

/**
 * ユーザー設定の操作
 */
export const SettingsStorage = {
  /**
   * ユーザー設定を取得する
   * @returns ユーザー設定オブジェクト
   */
  async get(): Promise<UserSettings> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return jsonValue != null 
        ? { ...DEFAULT_USER_SETTINGS, ...JSON.parse(jsonValue) }
        : DEFAULT_USER_SETTINGS;
    } catch (error) {
      console.error('ユーザー設定取得エラー:', error);
      return DEFAULT_USER_SETTINGS;
    }
  },

  /**
   * ユーザー設定を保存する
   * @param settings ユーザー設定オブジェクト
   * @returns 成功した場合はtrue
   */
  async save(settings: Partial<UserSettings>): Promise<boolean> {
    try {
      const currentSettings = await this.get();
      const updatedSettings = { ...currentSettings, ...settings };
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      console.error('ユーザー設定保存エラー:', error);
      return false;
    }
  },

  /**
   * デフォルト設定にリセットする
   * @returns 成功した場合はtrue
   */
  async reset(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(DEFAULT_USER_SETTINGS));
      return true;
    } catch (error) {
      console.error('ユーザー設定リセットエラー:', error);
      return false;
    }
  },
};

/**
 * 最後に開いていた画面の保存と取得
 */
export const LastScreenStorage = {
  /**
   * 最後に開いていた画面のパスを保存する
   * @param path 画面のパス
   * @returns 成功した場合はtrue
   */
  async save(path: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SCREEN, path);
      return true;
    } catch (error) {
      console.error('最終画面保存エラー:', error);
      return false;
    }
  },

  /**
   * 最後に開いていた画面のパスを取得する
   * @returns 画面のパス、存在しない場合は空文字列
   */
  async get(): Promise<string> {
    try {
      const path = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SCREEN);
      return path || '';
    } catch (error) {
      console.error('最終画面取得エラー:', error);
      return '';
    }
  },
};

/**
 * デフォルトのユーザー設定
 */
const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'system',
  showPhonetic: true,
  autoPlayAudio: true,
  newCardsPerDay: 20,
  reviewCardsPerDay: 100,
  buttonLayout: {
    order: [
      ResponseType.WRONG,
      ResponseType.AGAIN,
      ResponseType.HARD,
      ResponseType.CORRECT,
      ResponseType.EASY,
    ],
    sizes: {
      [ResponseType.WRONG]: 1,
      [ResponseType.AGAIN]: 1,
      [ResponseType.HARD]: 1,
      [ResponseType.CORRECT]: 1,
      [ResponseType.EASY]: 1,
    },
    colors: {
      [ResponseType.WRONG]: '#dc3545',
      [ResponseType.AGAIN]: '#ffc107',
      [ResponseType.HARD]: '#6c757d',
      [ResponseType.CORRECT]: '#2f95dc',
      [ResponseType.EASY]: '#28a745',
    },
  },
  fontSizes: {
    word: 32,
    phonetic: 20,
    meaning: 18,
    example: 16,
  },
  reviewIntervals: {
    wrong: 60, // 1時間（分単位）
    again: 360, // 6時間
    hard: 1440, // 1日
    correct: 4320, // 3日
    easy: 10080, // 7日
    wrongMultiplier: 1.1,
    againMultiplier: 1.2,
    hardMultiplier: 1.5,
    correctMultiplier: 2.0,
    easyMultiplier: 2.5,
  },
  notifications: {
    enabled: true,
    reminderTime: '19:00',
    studySessionDuration: 20,
    doNotDisturb: false,
  },
  isPremium: false,
};

/**
 * 単語カードのCRUD操作
 */
export const CardStorage = {
  /**
   * すべてのカードを取得する
   * @returns カードの配列
   */
  async getAll(): Promise<WordCard[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.CARDS);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('カード取得エラー:', error);
      return [];
    }
  },

  /**
   * IDでカードを取得する
   * @param id カードID
   * @returns カードオブジェクト、存在しない場合はnull
   */
  async getById(id: string): Promise<WordCard | null> {
    try {
      const cards = await this.getAll();
      return cards.find(card => card.id === id) || null;
    } catch (error) {
      console.error(`カード(ID:${id})取得エラー:`, error);
      return null;
    }
  },

  /**
   * カードを保存する（新規作成または更新）
   * @param card カードオブジェクト
   * @returns 成功した場合はtrue
   */
  async save(card: WordCard): Promise<boolean> {
    try {
      const cards = await this.getAll();
      const now = Date.now();
      
      // 既存のカードを検索
      const index = cards.findIndex(c => c.id === card.id);
      
      if (index >= 0) {
        // 既存のカードを更新
        cards[index] = {
          ...card,
          updatedAt: now,
        };
      } else {
        // 新規カードを追加
        cards.push({
          ...card,
          createdAt: now,
          updatedAt: now,
        });
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
      return true;
    } catch (error) {
      console.error('カード保存エラー:', error);
      return false;
    }
  },

  /**
   * カードを削除する
   * @param id カードID
   * @returns 成功した場合はtrue
   */
  async remove(id: string): Promise<boolean> {
    try {
      const cards = await this.getAll();
      const filteredCards = cards.filter(card => card.id !== id);
      
      if (filteredCards.length === cards.length) {
        // 削除対象のカードが見つからなかった
        return false;
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(filteredCards));
      return true;
    } catch (error) {
      console.error(`カード(ID:${id})削除エラー:`, error);
      return false;
    }
  },

  /**
   * 複数のカードを一括して保存する
   * @param cards カードの配列
   * @returns 成功した場合はtrue
   */
  async bulkSave(cards: WordCard[]): Promise<boolean> {
    try {
      const existingCards = await this.getAll();
      const now = Date.now();
      
      // IDをキーとした既存カードのマップを作成
      const cardMap = new Map<string, WordCard>();
      existingCards.forEach(card => cardMap.set(card.id, card));
      
      // 新しいカードを処理
      cards.forEach(card => {
        if (cardMap.has(card.id)) {
          // 既存のカードを更新
          cardMap.set(card.id, {
            ...card,
            updatedAt: now,
          });
        } else {
          // 新規カードを追加
          cardMap.set(card.id, {
            ...card,
            createdAt: now,
            updatedAt: now,
          });
        }
      });
      
      // マップから配列に変換して保存
      const updatedCards = Array.from(cardMap.values());
      await AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(updatedCards));
      return true;
    } catch (error) {
      console.error('複数カード保存エラー:', error);
      return false;
    }
  },
};