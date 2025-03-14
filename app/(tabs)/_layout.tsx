import { Tabs } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';

/**
 * タブアイコンを生成する関数
 * 
 * @param name - FontAwesomeのアイコン名
 * @param color - アイコンの色
 * @returns - FontAwesomeアイコンのコンポーネント
 */
function TabBarIcon({ name, color }: { name: React.ComponentProps<typeof FontAwesome>['name'], color: string }) {
  return <FontAwesome size={28} name={name} color={color} />;
}

/**
 * タブナビゲーションのレイアウト
 * 
 * このコンポーネントは:
 * 1. ボトムタブナビゲーションを設定
 * 2. 各タブのアイコン、ラベル、スタイルを定義
 * 3. ダークモードに対応したカラースキームを適用
 */
export default function TabLayout() {
  // 現在のカラースキーム（'light'または'dark'）を取得
  const colorScheme = useColorScheme();

  return (
    <Tabs
      // タブバー全体のスタイル
      screenOptions={{
        // 選択されたタブの色（ダークモードに応じて変更）
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // タブバー自体のスタイル
        tabBarStyle: {
          height: 60, // タブバーの高さ
          paddingBottom: 5, // 下部のパディング
        },
      }}>
      
      {/* ホーム画面タブ */}
      <Tabs.Screen
        name="index" // ファイル名に対応
        options={{
          title: 'ホーム', // タブのラベル
          // タブアイコンを定義（選択状態に応じて色を変更）
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          // 必要に応じてヘッダーをカスタマイズ
          headerTitle: '英単語アプリ',
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },
          headerTintColor: Colors[colorScheme ?? 'light'].text,
        }}
      />

      {/* 学習画面タブ */}
      <Tabs.Screen
        name="study" // ファイル名に対応
        options={{
          title: '学習', // タブのラベル
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
          headerTitle: '学習',
        }}
      />

      {/* 統計画面タブ */}
      <Tabs.Screen
        name="stats" // ファイル名に対応（元の構成ではtwo.tsxに相当）
        options={{
          title: '統計', // タブのラベル
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
          headerTitle: '学習統計',
        }}
      />

      {/* 設定画面タブ */}
      <Tabs.Screen
        name="settings" // ファイル名に対応
        options={{
          title: '設定', // タブのラベル
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
          headerTitle: '設定',
        }}
      />
    </Tabs>
  );
}