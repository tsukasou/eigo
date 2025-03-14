import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { v4 as uuidv4 } from 'uuid';
import { DeckStorage } from '@/services/storage';
import { Deck } from '@/types';

/**
 * モーダルウィンドウ
 * 
 * このコンポーネントは:
 * - 新規デッキの作成
 * - デッキの編集
 * を行うためのモーダルウィンドウを提供します。
 */
export default function ModalScreen() {
  // URLパラメータを取得
  const params = useLocalSearchParams();
  const mode = params.mode as 'create' | 'edit';
  const deckId = params.deckId as string;
  
  // 状態の定義
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // ルーターとテーマの取得
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // 既存のデッキを編集する場合はデータを読み込む
  React.useEffect(() => {
    if (mode === 'edit' && deckId) {
      const loadDeck = async () => {
        try {
          const deck = await DeckStorage.getById(deckId);
          if (deck) {
            setName(deck.name);
            setDescription(deck.description || '');
          }
        } catch (error) {
          console.error('デッキ読み込みエラー:', error);
          Alert.alert('エラー', 'デッキの読み込み中にエラーが発生しました。');
        }
      };
      
      loadDeck();
    }
  }, [mode, deckId]);

  // デッキを保存
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('エラー', 'デッキ名を入力してください。');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let deck: Deck;
      
      if (mode === 'edit' && deckId) {
        // 既存のデッキを更新
        const existingDeck = await DeckStorage.getById(deckId);
        if (!existingDeck) {
          throw new Error('デッキが見つかりません。');
        }
        
        deck = {
          ...existingDeck,
          name: name.trim(),
          description: description.trim() || undefined,
          updatedAt: Date.now()
        };
      } else {
        // 新規デッキを作成
        deck = {
          id: uuidv4(),
          name: name.trim(),
          description: description.trim() || undefined,
          cardIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }
      
      // デッキを保存
      const success = await DeckStorage.save(deck);
      
      if (success) {
        // 保存成功
        router.back();
      } else {
        throw new Error('デッキの保存に失敗しました。');
      }
    } catch (error) {
      console.error('デッキ保存エラー:', error);
      Alert.alert('エラー', 'デッキの保存中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen 
        options={{ 
          title: mode === 'create' ? 'デッキを作成' : 'デッキを編集',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={{ color: colors.tint, fontSize: 16, fontWeight: '600' }}>
                {isLoading ? '保存中...' : '保存'}
              </Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            デッキ名 <Text style={{ color: colors.button.danger }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: colors.card.background,
                borderColor: colors.card.border,
                color: colors.text
              }
            ]}
            value={name}
            onChangeText={setName}
            placeholder="デッキ名を入力"
            placeholderTextColor={colors.tabIconDefault}
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            説明
          </Text>
          <TextInput
            style={[
              styles.textArea, 
              { 
                backgroundColor: colors.card.background,
                borderColor: colors.card.border,
                color: colors.text
              }
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="デッキの説明を入力（オプション）"
            placeholderTextColor={colors.tabIconDefault}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.button.primary }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: colors.button.text }]}>
            {isLoading ? '保存中...' : mode === 'create' ? 'デッキを作成' : 'デッキを更新'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.button.secondary }]}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: colors.button.text }]}>
            キャンセル
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  buttonContainer: {
    padding: 16,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});