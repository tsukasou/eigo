import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Platform,
  ScrollView,
  Pressable
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { WordCard, ResponseType } from '@/types';

// コンポーネントのプロパティの型定義
interface CardProps {
  card: WordCard;                      // 表示するカード
  onResponse: (type: ResponseType) => void; // ユーザーの回答を処理するコールバック
  onFlip?: () => void;
  showPhonetic?: boolean;              // 発音記号を表示するか
  autoPlayAudio?: boolean;             // 音声を自動再生するか
}

/**
 * 単語カードコンポーネント
 * 
 * 機能:
 * - 表裏の切り替え表示（フリップアニメーション付き）
 * - 音声読み上げ
 * - 回答ボタン（間違えた、もう一度、難しい、正解、簡単）
 * - 意味の表示
 * - 例文の表示
 */
export default function Card({ 
  card, 
  onResponse, 
  onFlip, 
  showPhonetic = true, 
  autoPlayAudio = true 
}: CardProps) {
  // 状態の定義
  const [isFlipped, setIsFlipped] = useState(false);  // カードが裏返されているか
  const [flipAnim] = useState(new Animated.Value(0)); // フリップアニメーション用の値
  const [responseTime, setResponseTime] = useState<number | null>(null); // 回答時間
  const [startTime, setStartTime] = useState<number | null>(null); // カード表示開始時間

  // 現在のテーマを取得
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // カードが表示されたら時間を記録
  useEffect(() => {
    setStartTime(Date.now());
    
    // 自動音声再生が有効なら単語を読み上げる
    if (autoPlayAudio) {
      speakWord();
    }
    
    return () => {
      // コンポーネントがアンマウントされたらクリーンアップ
      Speech.stop();
    };
  }, []);

  // カードを裏返す関数
  const flipCard = () => {
    if (isFlipped) return; // 既に裏返っている場合は何もしない
    
    // 裏返すアニメーションを開始
    Animated.spring(flipAnim, {
      toValue: 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    
    // 状態を更新
    setIsFlipped(true);
    
    // 回答時間を記録
    if (startTime) {
      setResponseTime(Date.now() - startTime);
    }
  };

  // 単語を読み上げる関数
  const speakWord = () => {
    Speech.speak(card.word, {
      language: 'en', // 英語で読み上げ
      pitch: 1.0,     // 声の高さ（1.0が標準）
      rate: 0.8,      // 速度（1.0が標準、少し遅めに設定）
    });
  };

  // 回答ボタンがクリックされたときの処理
  const handleResponse = (type: ResponseType) => {
    // 回答情報をコールバックで親コンポーネントに渡す
    onResponse(type);
  };

  // フリップアニメーションの補間値を計算
  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg']
        })
      }
    ],
    opacity: flipAnim.interpolate({
      inputRange: [0.5, 0.5],
      outputRange: [1, 0]
    })
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg']
        })
      }
    ],
    opacity: flipAnim.interpolate({
      inputRange: [0.5, 0.5],
      outputRange: [0, 1]
    })
  };

  return (
    <View style={styles.container}>
      {/* カードの表面 */}
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          { backgroundColor: colors.card.background, borderColor: colors.card.border },
          frontAnimatedStyle
        ]}
      >
        <TouchableOpacity style={styles.flipButton} onPress={flipCard}>
          <Text style={[styles.word, { color: colors.card.text }]}>{card.word}</Text>
          {showPhonetic && card.phonetic && (
            <Text style={[styles.phonetic, { color: colors.card.text }]}>{card.phonetic}</Text>
          )}
          <Text style={[styles.flipHint, { color: colors.tint }]}>タップして裏返す</Text>
          
          {/* 音声再生ボタン */}
          <TouchableOpacity style={styles.speakButton} onPress={speakWord}>
            <FontAwesome name="volume-up" size={24} color={colors.tint} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>

      {/* カードの裏面 */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          { backgroundColor: colors.card.background, borderColor: colors.card.border },
          backAnimatedStyle
        ]}
      >
        <ScrollView style={styles.backContent}>
          {/* 単語と発音記号 */}
          <View style={styles.header}>
            <Text style={[styles.word, { color: colors.card.text }]}>{card.word}</Text>
            {showPhonetic && card.phonetic && (
              <Text style={[styles.phonetic, { color: colors.card.text }]}>{card.phonetic}</Text>
            )}
            
            {/* 音声再生ボタン */}
            <TouchableOpacity style={styles.speakButton} onPress={speakWord}>
              <FontAwesome name="volume-up" size={24} color={colors.tint} />
            </TouchableOpacity>
          </View>
          
          {/* 意味のリスト */}
          <View style={styles.meaningsContainer}>
            {card.meanings.map((meaning, index) => (
              <View key={meaning.id} style={styles.meaningItem}>
                {meaning.partOfSpeech && (
                  <Text style={[styles.partOfSpeech, { color: colors.tint }]}>
                    {meaning.partOfSpeech}
                  </Text>
                )}
                <Text style={[styles.definition, { color: colors.card.text }]}>
                  {meaning.definition}
                </Text>
                
                {/* 例文 */}
                {meaning.examples && meaning.examples.length > 0 && (
                  <View style={styles.examplesContainer}>
                    {meaning.examples.map((example, idx) => (
                      <View key={example.id} style={styles.exampleItem}>
                        <Text style={[styles.exampleText, { color: colors.card.text }]}>
                          • {example.text}
                        </Text>
                        {example.translation && (
                          <Text style={[styles.exampleTranslation, { color: colors.tabIconDefault }]}>
                            {example.translation}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
          
          {/* 語源 */}
          {card.etymology && (
            <View style={styles.etymologyContainer}>
              <Text style={[styles.etymologyTitle, { color: colors.tint }]}>語源:</Text>
              <Text style={[styles.etymologyText, { color: colors.card.text }]}>
                {card.etymology}
              </Text>
            </View>
          )}
          
          {/* 覚え方のヒント */}
          {card.memorizationTip && (
            <View style={styles.tipContainer}>
              <Text style={[styles.tipTitle, { color: colors.tint }]}>覚え方:</Text>
              <Text style={[styles.tipText, { color: colors.card.text }]}>
                {card.memorizationTip}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* 回答ボタン */}
        <View style={styles.responseButtons}>
          <Pressable
            style={[styles.responseButton, { backgroundColor: colors.button.danger }]}
            onPress={() => handleResponse(ResponseType.WRONG)}
          >
            <Text style={[styles.responseButtonText, { color: colors.button.text }]}>間違えた</Text>
          </Pressable>
          
          <Pressable
            style={[styles.responseButton, { backgroundColor: colors.button.warning }]}
            onPress={() => handleResponse(ResponseType.AGAIN)}
          >
            <Text style={[styles.responseButtonText, { color: colors.button.text }]}>もう一度</Text>
          </Pressable>
          
          <Pressable
            style={[styles.responseButton, { backgroundColor: colors.button.secondary }]}
            onPress={() => handleResponse(ResponseType.HARD)}
          >
            <Text style={[styles.responseButtonText, { color: colors.button.text }]}>難しい</Text>
          </Pressable>
          
          <Pressable
            style={[styles.responseButton, { backgroundColor: colors.button.primary }]}
            onPress={() => handleResponse(ResponseType.CORRECT)}
          >
            <Text style={[styles.responseButtonText, { color: colors.button.text }]}>正解</Text>
          </Pressable>
          
          <Pressable
            style={[styles.responseButton, { backgroundColor: colors.button.success }]}
            onPress={() => handleResponse(ResponseType.EASY)}
          >
            <Text style={[styles.responseButtonText, { color: colors.button.text }]}>簡単</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

// スタイル定義
const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 450,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  card: {
    width: '90%',
    height: '100%',
    borderRadius: 10,
    borderWidth: 1,
    position: 'absolute',
    backfaceVisibility: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardFront: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cardBack: {
    padding: 0,
  },
  flipButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  phonetic: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  flipHint: {
    fontSize: 16,
    marginTop: 20,
  },
  speakButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  backContent: {
    flex: 1,
    padding: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
    position: 'relative',
  },
  meaningsContainer: {
    marginBottom: 20,
  },
  meaningItem: {
    marginBottom: 15,
  },
  partOfSpeech: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  definition: {
    fontSize: 18,
    marginBottom: 10,
  },
  examplesContainer: {
    marginLeft: 15,
    marginTop: 5,
  },
  exampleItem: {
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  exampleTranslation: {
    fontSize: 14,
    marginLeft: 15,
  },
  etymologyContainer: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  etymologyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  etymologyText: {
    fontSize: 14,
  },
  tipContainer: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  responseButton: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  responseButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});