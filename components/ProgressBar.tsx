import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';

/**
 * プログレスバーのプロパティ
 */
interface ProgressBarProps {
  progress: number;  // 0から1の間の値（進捗率）
  height?: number;   // バーの高さ
  showPercentage?: boolean; // パーセンテージを表示するか
  label?: string;    // ラベル（オプション）
}

/**
 * プログレスバーコンポーネント
 * 
 * このコンポーネントは:
 * - 学習の進捗状況を視覚的に表示
 * - 色付きのバーとパーセンテージテキストで構成
 */
export default function ProgressBar({ 
  progress, 
  height = 10, 
  showPercentage = true, 
  label 
}: ProgressBarProps) {
  // 進捗率を0-1の範囲に制限
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  // パーセンテージに変換（0-100）
  const percentage = Math.round(clampedProgress * 100);
  
  // 現在のテーマを取得
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      {/* ラベルが指定されている場合は表示 */}
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      
      {/* プログレスバー本体 */}
      <View style={[
        styles.progressBackground, 
        { 
          backgroundColor: colors.progressBar.background,
          height
        }
      ]}>
        {/* 進捗を表す色付きの部分 */}
        <View 
          style={[
            styles.progressFill, 
            { 
              backgroundColor: colors.progressBar.fill,
              width: `${percentage}%`
            }
          ]} 
        />
      </View>
      
      {/* パーセンテージを表示する場合 */}
      {showPercentage && (
        <Text style={[styles.percentageText, { color: colors.text }]}>
          {percentage}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressBackground: {
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  percentageText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
});