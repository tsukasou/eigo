import React from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { Tabs } from 'expo-router';
import { useColorScheme } from '@hooks/useColorScheme';
import Colors from '@constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { ThemeProvider } from '@components/ThemeProvider';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';

// スプラッシュ画面を表示し続ける（フォントがロードされるまで）
SplashScreen.preventAutoHideAsync();

/**
 * ルートレイアウト - アプリ全体の基本レイアウトを定義
 * 
 * このコンポーネントは以下の役割を持ちます:
 * 1. 必要なフォントをロードする
 * 2. テーマプロバイダーを設定する（ダークモード対応）
 * 3. エラーハンドリングのためのエラーバウンダリーを設定する
 * 4. ナビゲーションスタックの基本設定を行う
 */
export default function RootLayout() {
  // フォントのロード
  // 第一引数: ロードするフォントのマッピング
  // 戻り値: [loaded（ロード完了かどうか）, error（エラー情報）]
  const [loaded, error] = useFonts({
    // シンプルで読みやすいフォントをロード
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // その他必要なフォント（太字、イタリックなど）も同様にロード可能
    ...FontAwesome.font,
  });

  // Expo Routerはエラーバウンダリーを使用してナビゲーション中のエラーをキャッチする
  // エラーがある場合は、エラーを投げて上位のエラーハンドラーに処理を委ねる
  React.useEffect(() => {
    if (error) throw error;
  }, [error]);

  // フォントがロードされたらスプラッシュ画面を非表示にする
  React.useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // フォントがロードされていない場合はnullを返す（スプラッシュ画面を表示したまま）
  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

/**
 * ルートナビゲーションレイアウト - アプリ全体のナビゲーション構造を定義
 * 
 * このコンポーネントは:
 * 1. テーマプロバイダーを設定してダークモード対応を実現
 * 2. Stack.Navigatorを使用してスクリーン間のナビゲーションを設定
 */
function RootLayoutNav() {
  // 現在のテーマ（'light'または'dark'）を取得
  const colorScheme = useColorScheme();

  return (
    // ThemeProviderでアプリ全体をラップしてテーマを適用
    // value属性に三項演算子を使用して'dark'か'light'かを判定
    <ThemeProvider value={colorScheme}>
      {/* Stack.Navigatorでスクリーン間のナビゲーションを設定 */}
      <Stack>
        {/* タブスクリーン - headerShown:falseでヘッダーを非表示 */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* モーダルスクリーン - presentation:'modal'でモーダル表示 */}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}