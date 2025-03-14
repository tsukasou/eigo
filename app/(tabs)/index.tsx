import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import DeckList from '@/components/DeckList';
import ProgressBar from '@/components/ProgressBar';
import { CardStorage, DeckStorage, LogStorage, SettingsStorage } from '@/services/storage';

/**
 * ホーム画面
 * 
 * このコンポーネントは:
 * - デッキ一覧を表示
 * - 現在の学習進捗状況のサマリーを表示
 * - 今日の学習タスクへのクイックアクセスを提供
 */
export default function HomeScreen() {
  // 状態の定義
  const [todayStats, setTodayStats] = useState({
    totalCards: 0,
    completedCards: 0,
    dueCards: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // ルーターとテーマの取得
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // 画面読み込み時に統計情報を取得
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        
        // 設定を取得
        const settings = await SettingsStorage.get();
        
        // すべてのデッキを取得
        const decks = await DeckStorage.getAll();
        
        // すべてのカードを取得
        const cards = await CardStorage.getAll();
        
        // 学習ログを取得
        const logs = await LogStorage.getAll();
        
        // 今日の日付の開始時刻
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();
        
        // 明日の日付の開始時刻
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStart = tomorrow.getTime();
        
        // 今日学習したカードのIDを取得
        const todayStudiedCardIds = new Set(
          logs
            .filter(log => log.studiedAt >= todayStart && log.studiedAt < tomorrowStart)
            .map(log => log.cardId)
        );
        
        // 学習待ちのカードのIDを取得
        const dueCardIds = new Set();
        const now = Date.now();
        
        // 各カードについて、最新のログを確認して期限切れかどうかを判定
        const cardLastLogs = new Map(); // カードIDごとの最新のログ
        
        for (const log of logs) {
          const existingLog = cardLastLogs.get(log.cardId);
          if (!existingLog || log.studiedAt > existingLog.studiedAt) {
            cardLastLogs.set(log.cardId, log);
          }
        }
        
        // 期限切れのカードを特定
        for (const [cardId, log] of cardLastLogs.entries()) {
          if (log.nextReviewDate <= now && !todayStudiedCardIds.has(cardId)) {
            dueCardIds.add(cardId);
          }
        }
        
        // 一度も学習していないカードも期限切れとしてカウント
        const studiedCardIds = new Set(logs.map(log => log.cardId));
        for (const card of cards) {
          if (!studiedCardIds.has(card.id)) {
            dueCardIds.add(card.id);
          }
        }
        
        // 今日の統計情報を設定
        setTodayStats({
          totalCards: cards.length,
          completedCards: todayStudiedCardIds.size,
          dueCards: dueCardIds.size
        });
      } catch (error) {
        console.error('統計情報の取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, []);

  // 学習ボタンのイベントハンドラ
  const handleStudyPress = () => {
    // 今日学習すべきカードがあるデッキに移動
    // 実際の実装では優先度の高いデッキを選択する必要がある
    router.push({
      pathname: "/(tabs)/study"
    } as any);
  };

  // ローディング中
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          データを読み込み中...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* 今日の統計情報 */}
        <View style={styles.todayContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            今日の学習
          </Text>
          
          <View style={[styles.todayCard, { backgroundColor: colors.card.background, borderColor: colors.card.border }]}>
            {/* 今日の進捗 */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTextContainer}>
                <Text style={[styles.progressLabel, { color: colors.text }]}>
                  今日の進捗
                </Text>
                <Text style={[styles.progressText, { color: colors.text }]}>
                  {todayStats.completedCards} / {todayStats.dueCards + todayStats.completedCards}
                </Text>
              </View>
              
              <ProgressBar 
                progress={
                  todayStats.dueCards + todayStats.completedCards > 0
                    ? todayStats.completedCards / (todayStats.dueCards + todayStats.completedCards)
                    : 0
                }
                height={8}
              />
            </View>
            
            {/* 学習待ちのカード数 */}
            <View style={styles.dueContainer}>
              <FontAwesome name="clock-o" size={18} color={colors.tint} />
              <Text style={[styles.dueText, { color: colors.text }]}>
                学習待ち: {todayStats.dueCards} 単語
              </Text>
            </View>
            
            {/* 学習ボタン */}
            {todayStats.dueCards > 0 && (
              <TouchableOpacity
                style={[styles.studyButton, { backgroundColor: colors.button.primary }]}
                onPress={handleStudyPress}
              >
                <Text style={[styles.studyButtonText, { color: colors.button.text }]}>
                  学習を始める
                </Text>
              </TouchableOpacity>
            )}
            
            {/* すべて完了した場合 */}
            {todayStats.dueCards === 0 && todayStats.completedCards > 0 && (
              <View style={styles.completedContainer}>
                <Ionicons name="checkmark-circle" size={24} color={colors.button.success} />
                <Text style={[styles.completedText, { color: colors.text }]}>
                  今日の学習は完了しました！
                </Text>
              </View>
            )}
            
            {/* カードがない場合 */}
            {todayStats.dueCards === 0 && todayStats.completedCards === 0 && (
              <View style={styles.completedContainer}>
                <Text style={[styles.completedText, { color: colors.text }]}>
                  学習するカードがありません
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* デッキ一覧 */}
        <View style={styles.decksContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            マイデッキ
          </Text>
          
          <DeckList />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  todayContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  todayCard: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dueText: {
    fontSize: 16,
    marginLeft: 8,
  },
  studyButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  studyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  decksContainer: {
    flex: 1,
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