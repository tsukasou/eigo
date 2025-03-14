import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { Deck } from '@/types';
import { DeckStorage, LogStorage } from '@/services/storage';

/**
 * デッキリストのプロパティ
 */
interface DeckListProps {
  onSelectDeck?: (deck: Deck) => void;
}

/**
 * デッキリストコンポーネント
 * 
 * このコンポーネントは:
 * - ユーザーが作成したデッキの一覧を表示
 * - 各デッキの基本情報と学習進捗を表示
 * - デッキをタップして学習画面に移動できる
 */
export default function DeckList({ onSelectDeck }: DeckListProps) {
  // 状態の定義
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deckStats, setDeckStats] = useState<{ [key: string]: { total: number, due: number } }>({});
  
  // ルーターとテーマの取得
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // デッキの読み込み
  useEffect(() => {
    const loadDecks = async () => {
      try {
        setIsLoading(true);
        const deckData = await DeckStorage.getAll();
        setDecks(deckData);
        
        // 各デッキの統計情報を取得
        const stats: { [key: string]: { total: number, due: number } } = {};
        const logs = await LogStorage.getAll();
        const now = Date.now();
        
        for (const deck of deckData) {
          const total = deck.cardIds.length;
          
          // 期限切れのカード数を計算
          const cardsWithLogs = new Set();
          let dueCount = 0;
          
          for (const log of logs) {
            if (deck.cardIds.includes(log.cardId)) {
              cardsWithLogs.add(log.cardId);
              if (log.nextReviewDate <= now) {
                // 最新のログのみをチェック
                const isLatestLog = !logs.some(
                  otherLog => 
                    otherLog.cardId === log.cardId && 
                    otherLog.studiedAt > log.studiedAt
                );
                
                if (isLatestLog) {
                  dueCount++;
                }
              }
            }
          }
          
          // まだ一度も学習していないカードも期限切れとして扱う
          const newCards = deck.cardIds.filter(id => !cardsWithLogs.has(id));
          dueCount += newCards.length;
          
          stats[deck.id] = { total, due: dueCount };
        }
        
        setDeckStats(stats);
      } catch (error) {
        console.error('デッキ読み込みエラー:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDecks();
  }, []);

  // デッキをタップしたときの処理
  const handleDeckPress = (deck: Deck) => {
    if (onSelectDeck) {
      onSelectDeck(deck);
    } else {
      // 学習画面に遷移
      router.push({
        pathname: "/(tabs)/study",
        params: { id: deck.id }
      } as any);
    }
  };

  // 新規デッキ作成画面に遷移
  const handleCreateDeck = () => {
    router.push('/modal');
  };

  // デッキが存在しない場合
  if (!isLoading && decks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          デッキがありません
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.button.primary }]}
          onPress={handleCreateDeck}
        >
          <Text style={[styles.createButtonText, { color: colors.button.text }]}>
            デッキを作成
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ローディング中
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          デッキを読み込み中...
        </Text>
      </View>
    );
  }

  // デッキを日付順に並べ替える（最新のものが先頭）
  const sortedDecks = [...decks].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sortedDecks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.deckItem, { backgroundColor: colors.card.background, borderColor: colors.card.border }]}
            onPress={() => handleDeckPress(item)}
          >
            <View style={styles.deckContent}>
              <Text style={[styles.deckName, { color: colors.card.text }]}>
                {item.name}
              </Text>
              
              {item.description && (
                <Text style={[styles.deckDescription, { color: colors.tabIconDefault }]} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              
              <View style={styles.deckStats}>
                <Text style={[styles.deckStatsText, { color: colors.tabIconDefault }]}>
                  {deckStats[item.id]?.total || 0} 単語
                </Text>
                
                {deckStats[item.id]?.due > 0 && (
                  <View style={styles.dueContainer}>
                    <Text style={[styles.dueText, { color: colors.button.danger }]}>
                      {deckStats[item.id]?.due || 0} 単語が学習待ち
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={colors.tabIconDefault} 
              style={styles.deckArrow} 
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
      
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.button.primary }]}
        onPress={handleCreateDeck}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  deckItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  deckContent: {
    flex: 1,
  },
  deckName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deckDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  deckStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deckStatsText: {
    fontSize: 14,
    marginRight: 12,
  },
  deckArrow: {
    marginLeft: 8,
  },
  dueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
})