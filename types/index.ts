/**
 * アプリ全体で使用する型定義
 */
// 既存の型定義の上部や適切な場所に追加
export type ColorScheme = 'light' | 'dark' | 'system';
// 単語カードの型
export interface WordCard {
    id: string;               // 一意のID
    word: string;             // 単語
    phonetic?: string;        // 発音記号（オプショナル）
    etymology?: string;       // 語源（オプショナル）
    meanings: Meaning[];      // 意味の配列
    memorizationTip?: string; // 覚え方のヒント（オプショナル）
    tags?: string[];          // タグ（難易度、カテゴリーなど）
    createdAt: number;        // 作成日時（タイムスタンプ）
    updatedAt: number;        // 更新日時（タイムスタンプ）
  }
  
  // 意味の型
  export interface Meaning {
    id: string;               // 一意のID
    definition: string;       // 定義・意味
    examples?: Example[];     // 例文の配列（オプショナル）
    partOfSpeech?: string;    // 品詞（動詞、名詞など）（オプショナル）
  }
  
  // 例文の型
  export interface Example {
    id: string;               // 一意のID
    text: string;             // 例文のテキスト
    translation?: string;     // 例文の翻訳（オプショナル）
  }
  
  // 単語デッキの型
  export interface Deck {
    id: string;               // 一意のID
    name: string;             // デッキ名
    description?: string;     // 説明（オプショナル）
    cardIds: string[];        // デッキに含まれるカードのID配列
    createdAt: number;        // 作成日時（タイムスタンプ）
    updatedAt: number;        // 更新日時（タイムスタンプ）
  }
  
  // 学習履歴の型
  export interface StudyLog {
    id: string;               // 一意のID
    cardId: string;           // 学習したカードのID
    deckId: string;           // 学習したデッキのID
    studiedAt: number;        // 学習した日時（タイムスタンプ）
    responseTime: number;     // 回答にかかった時間（ミリ秒）
    responseType: ResponseType; // 回答の種類
    nextReviewDate: number;   // 次の復習予定日（タイムスタンプ）
  }
  
  // 回答の種類
  export enum ResponseType {
    WRONG = 'wrong',          // 間違えた
    AGAIN = 'again',          // もう一度
    HARD = 'hard',            // 難しい
    CORRECT = 'correct',      // 正解
    EASY = 'easy',            // 簡単
  }
  
  // ユーザー設定の型
  export interface UserSettings {
    theme?: 'light' | 'dark' | 'system';  // テーマ設定
    showPhonetic: boolean;    // 発音記号を表示するか
    autoPlayAudio: boolean;   // 音声を自動再生するか
    newCardsPerDay: number;   // 一日の新規カード数
    reviewCardsPerDay: number; // 一日の復習カード数
    buttonLayout: ButtonLayout; // ボタンのレイアウト設定
    fontSizes: FontSizes;     // フォントサイズ設定
    reviewIntervals: ReviewIntervals; // 復習間隔設定
    notifications: NotificationSettings; // 通知設定
    isPremium: boolean;       // プレミアムユーザーかどうか
  }
  
  // ボタンレイアウトの型
  export interface ButtonLayout {
    order: ResponseType[];    // ボタンの表示順序
    sizes: { [key in ResponseType]: number }; // ボタンのサイズ
    colors: { [key in ResponseType]: string }; // ボタンの色
  }
  
  // フォントサイズの型
  export interface FontSizes {
    word: number;             // 単語のフォントサイズ
    phonetic: number;         // 発音記号のフォントサイズ
    meaning: number;          // 意味のフォントサイズ
    example: number;          // 例文のフォントサイズ
  }
  
  // 復習間隔の型
  export interface ReviewIntervals {
    wrong: number;            // 間違えた場合の間隔（分）
    again: number;            // もう一度の場合の間隔（分）
    hard: number;             // 難しい場合の間隔（分）
    correct: number;          // 正解の場合の間隔（分）
    easy: number;             // 簡単の場合の間隔（分）
    // 以下は間隔の乗数（ステップごとに何倍にするか）
    wrongMultiplier: number;
    againMultiplier: number;
    hardMultiplier: number;
    correctMultiplier: number;
    easyMultiplier: number;
  }
  
  // 通知設定の型
  export interface NotificationSettings {
    enabled: boolean;         // 通知を有効にするか
    reminderTime: string;     // リマインダーの時間（HH:MM形式）
    studySessionDuration: number; // 学習セッションの長さ（分）
    doNotDisturb: boolean;    // 学習中は他の通知をオフにするか
  }