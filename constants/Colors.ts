/**
 * アプリで使用する色の定義
 * 
 * ライトモードとダークモードの両方に対応した色を定義します。
 * 意味のある名前（text, background など）を使用することで、
 * アプリ全体で一貫した見た目を実現します。
 */

// 色の型定義
export type ThemeColors = {
  text: string;           // テキストの色
  background: string;     // 背景色
  tint: string;           // アクセントカラー・強調色
  tabIconDefault: string; // 非アクティブなタブアイコンの色
  tabIconSelected: string; // 選択中のタブアイコンの色
  card: {
    background: string;   // カードの背景色
    border: string;       // カードの枠線の色
    text: string;         // カード内のテキスト色
  };
  button: {
    primary: string;      // プライマリボタンの色
    secondary: string;    // セカンダリボタンの色
    success: string;      // 成功時のボタン色（正解、簡単など）
    warning: string;      // 警告時のボタン色（難しいなど）
    danger: string;       // 危険・エラー時のボタン色（間違えたなど）
    text: string;         // ボタン内のテキスト色
  };
  progressBar: {
    background: string;   // 進捗バーの背景色
    fill: string;         // 進捗バーの塗りつぶし色
  };
};

// ライトモード用の色
const light: ThemeColors = {
  text: '#000000',            // 黒
  background: '#f8f8f8',      // 薄いグレー
  tint: '#2f95dc',            // 青系
  tabIconDefault: '#888888',  // グレー
  tabIconSelected: '#2f95dc', // 青系
  card: {
    background: '#ffffff',    // 白
    border: '#dddddd',        // 薄いグレー
    text: '#000000',          // 黒
  },
  button: {
    primary: '#2f95dc',       // 青系
    secondary: '#6c757d',     // グレー
    success: '#28a745',       // 緑
    warning: '#ffc107',       // 黄色
    danger: '#dc3545',        // 赤
    text: '#ffffff',          // 白
  },
  progressBar: {
    background: '#e9ecef',    // 薄いグレー
    fill: '#2f95dc',          // 青系
  },
};

// ダークモード用の色
const dark: ThemeColors = {
  text: '#ffffff',            // 白
  background: '#121212',      // 暗めのグレー
  tint: '#4dabf5',            // 明るい青
  tabIconDefault: '#666666',  // グレー
  tabIconSelected: '#4dabf5', // 明るい青
  card: {
    background: '#1e1e1e',    // 濃いめのグレー
    border: '#333333',        // グレー
    text: '#ffffff',          // 白
  },
  button: {
    primary: '#4dabf5',       // 明るい青
    secondary: '#6c757d',     // グレー
    success: '#28a745',       // 緑
    warning: '#ffc107',       // 黄色
    danger: '#dc3545',        // 赤
    text: '#ffffff',          // 白
  },
  progressBar: {
    background: '#333333',    // グレー
    fill: '#4dabf5',          // 明るい青
  },
};

// エクスポート
export default {
  light,
  dark,
};