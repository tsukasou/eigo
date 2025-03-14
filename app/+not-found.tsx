import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

/**
 * 404ページ（Not Found）
 * 
 * このコンポーネントは:
 * - 存在しないルートにアクセスした場合に表示
 * - ホーム画面に戻るリンクを提供
 */
export default function NotFoundScreen() {
  // ルーターとテーマの取得
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons name="alert-circle-outline" size={80} color={colors.button.danger} />
      
      <Text style={[styles.title, { color: colors.text }]}>
        ページが見つかりません
      </Text>
      
      <Text style={[styles.message, { color: colors.tabIconDefault }]}>
        お探しのページは存在しないか、削除された可能性があります。
      </Text>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.button.primary }]}
        onPress={() => router.push('/')}
      >
        <Text style={[styles.buttonText, { color: colors.button.text }]}>
          ホームに戻る
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});