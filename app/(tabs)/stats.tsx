import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { CardStorage, DeckStorage, LogStorage } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { ResponseType } from '@/types';

/**
 * 統計画面
 * 
 * このコンポーネントは:
 * - 学習の統計情報を表示
 * - チャートや数値で全体的な進捗を確認できる
 */
export default function StatsScreen() {
  // 状態の定義
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCards: 0,
    learnedCards: 0,
    reviewedCards: 0,
    completedCards: 0,
    streakDays: 0,
    todayLearned: 0,
    responseStats: {
      [ResponseType.WRONG]: 0,
      [ResponseType.AGAIN]: 0,
      [ResponseType.HARD]: 0,
      [ResponseType.CORRECT]: 0,
      [ResponseType.EASY]: 0,
    },
    weeklyLearning: [0, 0, 0, 0, 0, 0, 0], // 最近7日間の学習カード数
  });
  
  // フィルタリング期間
  const [periodFilter, setPeriodFilter] = useState<'week' | 'month' | 'all'>('week');
  
  // テーマの取得
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // 統計情報を読み込む
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        
        // カード、デッキ、ログを取得
        const cards = await CardStorage.getAll();
        const decks = await DeckStorage.getAll();
        const logs = await LogStorage.getAll();
        
        // 現在の日時
        const now = Date.now();
        
        // 期間に基づいてログをフィルタリング
        let filteredLogs = logs;
        
        if (periodFilter === 'week') {
          // 7日前のタイムスタンプ
          const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
          filteredLogs = logs.filter(log => log.studiedAt >= weekAgo);
        } else if (periodFilter === 'month') {
          // 30日前のタイムスタンプ
          const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
          filteredLogs = logs.filter(log => log.studiedAt >= monthAgo);
        }
        
        // 今日の学習カード数
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();
        const todayEnd = todayStart + 24 * 60 * 60 * 1000;
        const todayLogs = logs.filter(log => log.studiedAt >= todayStart && log.studiedAt < todayEnd);
        const todayLearnedCards = new Set(todayLogs.map(log => log.cardId)).size;
        
        // 週間学習データの計算
        const weeklyData = [0, 0, 0, 0, 0, 0, 0];
        
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const dayStart = date.getTime();
          const dayEnd = dayStart + 24 * 60 * 60 * 1000;
          
          const dayLogs = logs.filter(log => log.studiedAt >= dayStart && log.studiedAt < dayEnd);
          const uniqueCardIds = new Set(dayLogs.map(log => log.cardId));
          weeklyData[6 - i] = uniqueCardIds.size;
        }
        
        // 回答タイプごとの数
        const responseStats = {
          [ResponseType.WRONG]: 0,
          [ResponseType.AGAIN]: 0,
          [ResponseType.HARD]: 0,
          [ResponseType.CORRECT]: 0,
          [ResponseType.EASY]: 0,
        };
        
        filteredLogs.forEach(log => {
          responseStats[log.responseType]++;
        });
        
        // 連続学習日数の計算
        let streakDays = 0;
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // 今日学習したかどうか
        const studiedToday = todayLogs.length > 0;
        
        // 過去の日付を遡って連続学習日数を計算
        let currentDate = studiedToday ? yesterday : today;
        let continuousStreak = studiedToday ? 1 : 0;
        
        while (true) {
          const dayStart = currentDate.setHours(0, 0, 0, 0);
          const dayEnd = dayStart + 24 * 60 * 60 * 1000;
          
          const dayLogs = logs.filter(log => log.studiedAt >= dayStart && log.studiedAt < dayEnd);
          
          if (dayLogs.length === 0) {
            break;
          }
          
          continuousStreak++;
          currentDate.setDate(currentDate.getDate() - 1);
        }
        
        streakDays = continuousStreak;
        
        // 学習済みカードの計算
        const learnedCardIds = new Set(logs.map(log => log.cardId));
        
        // 完了カードの計算（一定基準以上のカード）
        const completedCardIds = new Set();
        const cardLastLogs = new Map(); // カードIDごとの最新のログ
        
        // 各カードの最新のログを取得
        for (const log of logs) {
          const existingLog = cardLastLogs.get(log.cardId);
          if (!existingLog || log.studiedAt > existingLog.studiedAt) {
            cardLastLogs.set(log.cardId, log);
          }
        }
        
        // 一定の基準を満たすカードを「完了」とみなす
        // 例: 次の復習日が現在から30日以上先のもの
        const thirtyDaysLater = now + 30 * 24 * 60 * 60 * 1000;
        for (const [cardId, log] of cardLastLogs.entries()) {
          if (log.nextReviewDate >= thirtyDaysLater) {
            completedCardIds.add(cardId);
          }
        }
        
        // 統計情報を設定
        setStats({
          totalCards: cards.length,
          learnedCards: learnedCardIds.size,
          reviewedCards: filteredLogs.length,
          completedCards: completedCardIds.size,
          streakDays,
          todayLearned: todayLearnedCards,
          responseStats,
          weeklyLearning: weeklyData,
        });
        
      } catch (error) {
        console.error('統計情報の読み込みエラー:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, [periodFilter]);

  // ローディング中
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          統計データを読み込み中...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* 期間フィルター */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              periodFilter === 'week' && { backgroundColor: colors.tint }
            ]}
            onPress={() => setPeriodFilter('week')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: periodFilter === 'week' ? colors.button.text : colors.text }
              ]}
            >
              週間
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              periodFilter === 'month' && { backgroundColor: colors.tint }
            ]}
            onPress={() => setPeriodFilter('month')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: periodFilter === 'month' ? colors.button.text : colors.text }
              ]}
            >
              月間
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              periodFilter === 'all' && { backgroundColor: colors.tint }
            ]}
            onPress={() => setPeriodFilter('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: periodFilter === 'all' ? colors.button.text : colors.text }
              ]}
            >
              全期間
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* サマリーカード */}
        <View style={[styles.card, { backgroundColor: colors.card.background, borderColor: colors.card.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            学習サマリー
          </Text>
          
          <View style={styles.summaryContainer}>
            {/* 総カード数 */}
            <View style={styles.summaryItem}>
              <Ionicons name="document-text" size={24} color={colors.tint} />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {stats.totalCards}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>
                総カード数
              </Text>
            </View>
            
            {/* 学習済み */}
            <View style={styles.summaryItem}>
              <Ionicons name="eye" size={24} color={colors.tint} />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {stats.learnedCards}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>
                学習済み
              </Text>
            </View>
            
            {/* 完了 */}
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle" size={24} color={colors.button.success} />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {stats.completedCards}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>
                習得済み
              </Text>
            </View>
          </View>
        </View>
        
        {/* 連続学習 */}
        <View style={[styles.card, { backgroundColor: colors.card.background, borderColor: colors.card.border }]}>
          <View style={styles.streakHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              連続学習日数
            </Text>
            
            <View style={styles.todayLearned}>
              <Text style={[styles.todayLearnedText, { color: colors.tabIconDefault }]}>
                今日: {stats.todayLearned} 単語
              </Text>
            </View>
          </View>
          
          <View style={styles.streakContainer}>
            <Ionicons 
              name="flame" 
              size={40} 
              color={stats.streakDays > 0 ? '#ff9500' : colors.tabIconDefault} 
            />
            <Text style={[styles.streakValue, { color: colors.text }]}>
              {stats.streakDays}日
            </Text>
          </View>
        </View>
        
        {/* 週間チャート */}
        <View style={[styles.card, { backgroundColor: colors.card.background, borderColor: colors.card.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            週間学習カード数
          </Text>
          
          <View style={styles.chartContainer}>
            {/* 単純なバーチャートを実装 */}
            {stats.weeklyLearning.map((value, index) => {
              const day = new Date();
              day.setDate(day.getDate() - 6 + index);
              const dayName = day.toLocaleDateString('ja-JP', { weekday: 'short' });
              
              // 最大値を見つけて高さを相対的に設定
              const maxValue = Math.max(...stats.weeklyLearning, 1);
              const barHeight = value > 0 ? Math.max((value / maxValue) * 100, 15) : 0;
              
              return (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.barLabelContainer}>
                    <Text style={[styles.barValue, { color: colors.text }]}>
                      {value}
                    </Text>
                  </View>
                  
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: barHeight, 
                        backgroundColor: value > 0 ? colors.tint : colors.tabIconDefault
                      }
                    ]} 
                  />
                  
                  <Text style={[styles.barLabel, { color: colors.tabIconDefault }]}>
                    {dayName}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* 回答統計 */}
        <View style={[styles.card, { backgroundColor: colors.card.background, borderColor: colors.card.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            回答統計
          </Text>
          
          <View style={styles.responseStatsContainer}>
            {/* 正解 */}
            <View style={styles.responseItem}>
              <View 
                style={[
                  styles.responseBar, 
                  { 
                    width: `${getPercentage(stats.responseStats[ResponseType.CORRECT], stats.reviewedCards)}%`,
                    backgroundColor: colors.button.primary
                  }
                ]} 
              />
              <View style={styles.responseLabel}>
                <Text style={[styles.responseText, { color: colors.text }]}>
                  正解
                </Text>
                <Text style={[styles.responseValue, { color: colors.tabIconDefault }]}>
                  {stats.responseStats[ResponseType.CORRECT]} ({getPercentage(stats.responseStats[ResponseType.CORRECT], stats.reviewedCards)}%)
                </Text>
              </View>
            </View>
            
            {/* 簡単 */}
            <View style={styles.responseItem}>
              <View 
                style={[
                  styles.responseBar, 
                  { 
                    width: `${getPercentage(stats.responseStats[ResponseType.EASY], stats.reviewedCards)}%`,
                    backgroundColor: colors.button.success
                  }
                ]} 
              />
              <View style={styles.responseLabel}>
                <Text style={[styles.responseText, { color: colors.text }]}>
                  簡単
                </Text>
                <Text style={[styles.responseValue, { color: colors.tabIconDefault }]}>
                  {stats.responseStats[ResponseType.EASY]} ({getPercentage(stats.responseStats[ResponseType.EASY], stats.reviewedCards)}%)
                </Text>
              </View>
            </View>
            
            {/* 難しい */}
            <View style={styles.responseItem}>
              <View 
                style={[
                  styles.responseBar, 
                  { 
                    width: `${getPercentage(stats.responseStats[ResponseType.HARD], stats.reviewedCards)}%`,
                    backgroundColor: colors.button.secondary
                  }
                ]} 
              />
              <View style={styles.responseLabel}>
                <Text style={[styles.responseText, { color: colors.text }]}>
                  難しい
                </Text>
                <Text style={[styles.responseValue, { color: colors.tabIconDefault }]}>
                  {stats.responseStats[ResponseType.HARD]} ({getPercentage(stats.responseStats[ResponseType.HARD], stats.reviewedCards)}%)
                </Text>
              </View>
            </View>
            
            {/* もう一度 */}
            <View style={styles.responseItem}>
              <View 
                style={[
                  styles.responseBar, 
                  { 
                    width: `${getPercentage(stats.responseStats[ResponseType.AGAIN], stats.reviewedCards)}%`,
                    backgroundColor: colors.button.warning
                  }
                ]} 
              />
              <View style={styles.responseLabel}>
                <Text style={[styles.responseText, { color: colors.text }]}>
                  もう一度
                </Text>
                <Text style={[styles.responseValue, { color: colors.tabIconDefault }]}>
                  {stats.responseStats[ResponseType.AGAIN]} ({getPercentage(stats.responseStats[ResponseType.AGAIN], stats.reviewedCards)}%)
                </Text>
              </View>
            </View>
            
            {/* 間違えた */}
            <View style={styles.responseItem}>
              <View 
                style={[
                  styles.responseBar, 
                  { 
                    width: `${getPercentage(stats.responseStats[ResponseType.WRONG], stats.reviewedCards)}%`,
                    backgroundColor: colors.button.danger
                  }
                ]} 
              />
              <View style={styles.responseLabel}>
                <Text style={[styles.responseText, { color: colors.text }]}>
                  間違えた
                </Text>
                <Text style={[styles.responseValue, { color: colors.tabIconDefault }]}>
                  {stats.responseStats[ResponseType.WRONG]} ({getPercentage(stats.responseStats[ResponseType.WRONG], stats.reviewedCards)}%)
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// パーセンテージを計算する関数
function getPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayLearned: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayLearnedText: {
    fontSize: 14,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 160,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barLabelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  bar: {
    width: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
  },
  responseStatsContainer: {
    width: '100%',
  },
  responseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  responseBar: {
    height: 24,
    borderRadius: 4,
    marginRight: 12,
  },
  responseLabel: {
    position: 'absolute',
    left: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
  },
  responseText: {
    fontSize: 14,
    fontWeight: '500',
  },
  responseValue: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
});