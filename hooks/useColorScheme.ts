import { useEffect, useState } from 'react';
import { useColorScheme as _useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// カラースキームの型定義
export type ColorScheme = 'light' | 'dark';

// ストレージキー
const COLOR_SCHEME_KEY = 'user-color-scheme';

/**
 * カラースキームを取得・設定するためのカスタムフック
 * 
 * 機能:
 * 1. システムのカラースキーム設定を取得
 * 2. ユーザーが手動で設定したカラースキームをAsyncStorageから読み込み
 * 3. カラースキームの変更をAsyncStorageに保存
 * 
 * @returns 現在のカラースキーム ('light' または 'dark')
 */
export function useColorScheme(): ColorScheme {
  // システムのカラースキーム設定
  const systemColorScheme = _useColorScheme() as ColorScheme;
  // ユーザー設定のカラースキーム（カスタム設定）
  const [userColorScheme, setUserColorScheme] = useState<ColorScheme | null>(null);

  // 初回マウント時にAsyncStorageからユーザー設定を読み込む
  useEffect(() => {
    const loadUserPreference = async () => {
      try {
        const savedScheme = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
        if (savedScheme === 'light' || savedScheme === 'dark') {
          setUserColorScheme(savedScheme);
        }
      } catch (error) {
        console.error('カラースキームの読み込みに失敗しました:', error);
      }
    };

    loadUserPreference();
  }, []);

  // カラースキーム変更関数
  // この関数は直接利用せず、設定画面から呼び出す想定
  const setColorScheme = async (scheme: ColorScheme | 'system') => {
    try {
      if (scheme === 'system') {
        // システム設定に戻す場合は保存データを削除
        await AsyncStorage.removeItem(COLOR_SCHEME_KEY);
        setUserColorScheme(null);
      } else {
        // ユーザー設定を保存
        await AsyncStorage.setItem(COLOR_SCHEME_KEY, scheme);
        setUserColorScheme(scheme);
      }
    } catch (error) {
      console.error('カラースキームの保存に失敗しました:', error);
    }
  };

  // ユーザー設定がある場合はそれを優先、なければシステム設定を使用
  return userColorScheme ?? systemColorScheme ?? 'light';
}