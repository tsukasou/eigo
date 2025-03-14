import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import { useDeck } from '@/hooks/useDeck';
import { ResponseType } from '@/types';
import { DeckStorage, LogStorage } from '@/services/storage';

/**
 * 学習画面
 * 
 * このコンポーネントは:
 * - フラッシュカードを表示して学習を進める
 * - 進捗状況を表示
 * - 学習セッションの統計を表示
 */
export default function StudyScreen() {
  // URLパラメータからデッキIDを取得
  const params = useLocalSearchParams();
  const deckId = params.id as string || 'next';
  
  // 状態の定義
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deckName, setDeckName] = useState('学習');
  
  // ルーターとテーマの取得
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  // useDeckフックを使用してデッキと学習セッションを管理
  const { 
    deck, 
    currentCard, 
    progress, 
    sessionStats, 
    handleResponse, 
    resetSession,
    isSessionComplete
  } = useDeck(deckId === 'next' ? '' : deckId);

  // deckIdが'next'の場合は優先度の高いデッキを自動的に選択
  useEffect(() => {
    const loadNextDeck = async () => {
      if (deckId === 'next') {
        try {
          setIsLoading(true);
          
          // すべてのデッキを取得
          const decks = await DeckStorage.getAll();
          if (decks.length === 0) {
            // デッキがない場合はホーム画面に戻る
            Alert.alert(
              'デッキがありません',
              '学習を始めるには、まずデッキを作成してください。',
              [{ text: 'OK', onPress: () => router.push('/') }]
            );
            return;
          }
          
          // すべての学習ログを取得
          const logs = await LogStorage.getAll();
          const now = Date.now();
          
          // 各デッキの学習待ちカード数を計算
          const deckDueCounts: { deckId: string; dueCount: number; totalCards: number }[] = [];
          
          for (const deck of decks) {
            // 学習待ちのカードを数える
            const cardLastLogs = new Map(); // カードIDごとの最新のログ
            
            // 各カードの最新のログを取得
            for (const log of logs) {
              if (deck.cardIds.includes(log.cardId)) {
                const existingLog = cardLastLogs.get(log.cardId);
                if (!existingLog || log.studiedAt > existingLog.studiedAt) {
                  cardLastLogs.set(log.cardId, log);
                }
              }
            }
            
            // 期限切れのカードを特定
            let dueCount = 0;
            for (const [cardId, log] of cardLastLogs.entries()) {
              if (log.nextReviewDate <= now) {
                dueCount++;
              }
            }
            
            // 一度も学習していないカードも期限切れとしてカウント
            const studiedCardIds = new Set(
              logs.filter(log => deck.cardIds.includes(log.cardId)).map(log => log.cardId)
            );
            const newCards = deck.cardIds.filter(id => !studiedCardIds.has(id));
            dueCount += newCards.length;
            
            deckDueCounts.push({
              deckId: deck.id,
              dueCount,
              totalCards: deck.cardIds.length
            });
          }
          
          // 学習待ちカードが多いデッキを優先
          deckDueCounts.sort((a, b) => b.dueCount - a.dueCount);
          
          // 学習待ちカードがあるデッキがあれば、そのデッキを選択
          if (deckDueCounts.length > 0 && deckDueCounts[0].dueCount > 0) {
            const topDeck = await DeckStorage.getById(deckDueCounts[0].deckId);
            if (topDeck) {
              setDeckName(topDeck.name);
              // ここでuseDeckフックを再初期化するための状態更新
              // 実際の実装ではルーティングを使うなど別の方法が必要かもしれない
              router.replace({
                pathname: "/(tabs)/study",
                params: { id: topDeck.id }
              });
            }
          } else {
            // 学習待ちのカードがない場合
            Alert.alert(
              '学習完了',
              '今日の学習はすべて完了しました。',
              [{ text: 'OK', onPress: () => router.push('/') }]
            );
          }
        } catch (error) {
          console.error('次のデッキ読み込みエラー:', error);
          Alert.alert('エラー', '学習データの読み込み中にエラーが発生しました。');
        } finally {
          setIsLoading(false);
        }
      } else if (deck) {
        setDeckName(deck.name);
        setIsLoading(false);
      }
    };
    
    loadNextDeck();
  }, [deckId, deck, router]);

  // カードをめくった時の処理
  const onCardFlip = () => {
    if (startTime) {
      setResponseTime(Date.now() - startTime);
    }
  };

  // カードの回答を処理
  const onCardResponse = (type: ResponseType) => {
    if (responseTime) {
      handleResponse(type, responseTime);
      // 次のカードのタイマーをリセット
      setStartTime(Date.now());
      setResponseTime(null);
    }
  };

  // 学習セッションを再開
  const onRestartSession = () => {
    resetSession();
    setStartTime(Date.now());
  };

  // ローディング中
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          学習データを読み込み中...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={[styles.deckName, { color: colors.text }]}>
          {deckName}
        </Text>
        
        {/* 進捗バー */}
        <View style={styles.progressContainer}>
          <ProgressBar 
            progress={progress.total > 0 ? progress.completed / progress.total : 0} 
            height={4}
            showPercentage={false}
          />
          
          <Text style={[styles.progressText, { color: colors.tabIconDefault }]}>
            {progress.completed} / {progress.total}
          </Text>
        </View>
      </View>
      
      {/* メインコンテンツ */}
      <View style={styles.content}>
        {/* 現在のカードを表示 */}
        {currentCard && !isSessionComplete && (
          <Card 
            card={currentCard} 
            onResponse={onCardResponse}
            onFlip={onCardFlip}
          />
        )}
        
        {/* セッション完了時 */}
        {isSessionComplete && (
          <View style={[styles.completedContainer, { backgroundColor: colors.card.background, borderColor: colors.card.border }]}>
            <Ionicons name="checkmark-circle" size={48} color={colors.button.success} />
            
            <Text style={[styles.completedTitle, { color: colors.text }]}>
              学習完了！
            </Text>
            
            <Text style={[styles.completedText, { color: colors.tabIconDefault }]}>
              {progress.total}枚のカードを学習しました
            </Text>
            
            {/* 統計情報 */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.button.success }]}>
                  {sessionStats.easy}
                </Text>
                <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>
                  簡単
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.button.primary }]}>
                  {sessionStats.correct}
                </Text>
                <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>
                  正解
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.button.secondary }]}>
                  {sessionStats.hard}
                </Text>
                <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>
                  難しい
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.button.warning }]}>
                  {sessionStats.again}
                </Text>
                <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>
                  もう一度
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.button.danger }]}>
                  {sessionStats.incorrect}
                </Text>
                <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>
                  間違えた
                </Text>
              </View>
            </View>
            
            {/* ボタン */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.button.primary }]}
                onPress={onRestartSession}
              >
                <Text style={[styles.buttonText, { color: colors.button.text }]}>
                  もう一度学習する
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.button.secondary }]}
                onPress={() => router.push('/')}
              >
                <Text style={[styles.buttonText, { color: colors.button.text }]}>
                  ホームに戻る
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* カードがない場合 */}
        {!currentCard && !isSessionComplete && (
          <View style={[styles.noCardsContainer, { backgroundColor: colors.card.background, borderColor: colors.card.border }]}>
            <Ionicons name="information-circle-outline" size={48} color={colors.tint} />
            
            <Text style={[styles.noCardsTitle, { color: colors.text }]}>
              カードがありません
            </Text>
            
            <Text style={[styles.noCardsText, { color: colors.tabIconDefault }]}>
              このデッキには学習するカードがありません。
              新しいカードを追加するか、別のデッキを選択してください。
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
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  deckName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedContainer: {
    width: '100%',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  completedText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonsContainer: {
    width: '100%',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noCardsContainer: {
    width: '100%',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  noCardsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noCardsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
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