import React, { createContext, useContext } from 'react';
import { ColorSchemeName } from 'react-native';

// テーマコンテキストの作成
const ThemeContext = createContext<ColorSchemeName>('light');

/**
 * テーマプロバイダーのプロパティ
 */
interface ThemeProviderProps {
  value: ColorSchemeName;
  children: React.ReactNode;
}

/**
 * テーマプロバイダーコンポーネント
 * 
 * このコンポーネントは:
 * - アプリ全体でテーマ（ライト/ダーク）の情報を提供するためのコンテキストプロバイダー
 * - アプリのどこからでもuseThemeを使ってテーマ情報にアクセスできるようにする
 */
export function ThemeProvider({ value, children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * テーマを取得するためのカスタムフック
 * このフックをコンポーネント内で使用することで現在のテーマを取得できる
 * 
 * @returns 現在のテーマ ('light' または 'dark')
 */
export function useTheme() {
  const theme = useContext(ThemeContext);
  return theme;
}