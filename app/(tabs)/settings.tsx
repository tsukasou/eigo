import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  Switch, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Linking from 'expo-linking';
import { SettingsStorage, CardStorage, DeckStorage, LogStorage } from '@/services/storage';
import { UserSettings, ColorScheme } from '@/types';
import * as Application from 'expo-application';

/**
 * 設定画面
 * 
 * このコンポーネントは:
 * - アプリ設定の表示と変更
 * - テーマ切り替え
 * - 学習設定のカスタマイズ
 * - アプリ情報の表示
 */
export default function SettingsScreen() {
  // 状態の定義
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // テーマの取得
  const systemColorScheme = useColorScheme();
  const colors = Colors[systemColorScheme];

  // 設定を読み込む
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const userSettings = await SettingsStorage.get();
        setSettings(userSettings);
      } catch (error) {
        console.error('設定の読み込みエラー:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // 設定を保存する
  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      if (!settings) return;
      
      // 現在の設定と新しい設定をマージ
      const updatedSettings = { ...settings, ...newSettings };
      
      // 保存
      await SettingsStorage.save(newSettings);
      
      // 状態を更新
      setSettings(updatedSettings);
    } catch (error) {
      console.error('設定の保存エラー:', error);
      Alert.alert('エラー', '設定の保存中にエラーが発生しました。');
    }
  };

  // テーマを変更
  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    await saveSettings({ theme });
  };

  // データをリセット
  const handleResetData = () => {
    Alert.alert(
      'データをリセット',
      'すべての単語カード、デッキ、学習履歴がリセットされます。この操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'リセット', 
          style: 'destructive',
          onPress: async () => {
            try {
              // すべてのデータを削除
              await AsyncStorage.clear();
              
              // デフォルト設定を再作成
              await SettingsStorage.reset();
              
              // 設定を再読み込み
              const userSettings = await SettingsStorage.get();
              setSettings(userSettings);
              
              Alert.alert(
                'リセット完了',
                'すべてのデータがリセットされました。',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('データリセットエラー:', error);
              Alert.alert('エラー', 'データのリセット中にエラーが発生しました。');
            }
          } 
        }
      ]
    );
  };

  // ローディング中
  if (isLoading || !settings) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          設定を読み込み中...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* 表示設定 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            表示設定
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: colors.card.background, borderColor: colors.card.border }]}>
            {/* テーマ設定 */}
            <View style={styles.settingGroup}>
              <Text style={[styles.settingGroupTitle, { color: colors.text }]}>
                テーマ
              </Text>
              
              <View style={styles.themeButtons}>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    settings.theme === 'light' && { backgroundColor: colors.tint }
                  ]}
                  onPress={() => handleThemeChange('light')}
                >
                  <Ionicons 
                    name="sunny" 
                    size={20} 
                    color={settings.theme === 'light' ? colors.button.text : colors.text} 
                  />
                  <Text 
                    style={[
                      styles.themeButtonText, 
                      { color: settings.theme === 'light' ? colors.button.text : colors.text }
                    ]}
                  >
                    ライト
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    settings.theme === 'dark' && { backgroundColor: colors.tint }
                  ]}
                  onPress={() => handleThemeChange('dark')}
                >
                  <Ionicons 
                    name="moon" 
                    size={20} 
                    color={settings.theme === 'dark' ? colors.button.text : colors.text} 
                  />
                  <Text 
                    style={[
                      styles.themeButtonText, 
                      { color: settings.theme === 'dark' ? colors.button.text : colors.text }
                    ]}
                  >
                    ダーク
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    settings.theme === 'system' && { backgroundColor: colors.tint }
                  ]}
                  onPress={() => handleThemeChange('system')}
                >
                  <Ionicons 
                    name="phone-portrait" 
                    size={20} 
                    color={settings.theme === 'system' ? colors.button.text : colors.text} 
                  />
                  <Text 
                    style={[
                      styles.themeButtonText, 
                      { color: settings.theme === 'system' ? colors.button.text : colors.text }
                    ]}
                  >
                    システム
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* 発音記号表示 */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                発音記号を表示
              </Text>
              <Switch
                value={settings.showPhonetic}
                onValueChange={(value) => saveSettings({ showPhonetic: value })}
                trackColor={{ false: colors.progressBar.background, true: colors.tint }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#f4f3f4'}
              />
            </View>
            
            {/* 自動音声再生 */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                単語を自動的に読み上げる
              </Text>
              <Switch
                value={settings.autoPlayAudio}
                onValueChange={(value) => saveSettings({ autoPlayAudio: value })}
                trackColor={{ false: colors.progressBar.background, true: colors.tint }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#f4f3f4'}
              />
            </View>
          </View>
        </View>
        
        {/* 学習設定 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            学習設定
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: colors.card.background, borderColor: colors.card.border }]}>
            {/* 新規カード数 */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                一日の新規カード数: {settings.newCardsPerDay}
              </Text>
              <Slider
                style={styles.slider}
                value={settings.newCardsPerDay}
                minimumValue={5}
                maximumValue={50}
                step={5}
                minimumTrackTintColor={colors.tint}
                maximumTrackTintColor={colors.progressBar.background}
                thumbTintColor={colors.tint}
                onSlidingComplete={(value) => saveSettings({ newCardsPerDay: value })}
              />
            </View>
            
            {/* 復習カード数 */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                一日の復習カード数: {settings.reviewCardsPerDay}
              </Text>
              <Slider
                style={styles.slider}
                value={settings.reviewCardsPerDay}
                minimumValue={10}
                maximumValue={200}
                step={10}
                minimumTrackTintColor={colors.tint}
                maximumTrackTintColor={colors.progressBar.background}
                thumbTintColor={colors.tint}
                onSlidingComplete={(value) => saveSettings({ reviewCardsPerDay: value })}
              />
            </View>
          </View>
        </View>
        
        {/* 通知設定 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            通知設定
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: colors.card.background, borderColor: colors.card.border }]}>
            {/* 通知を有効にする */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                学習リマインダーを有効にする
              </Text>
              <Switch
                value={settings.notifications.enabled}
                onValueChange={(value) => saveSettings({ 
                  notifications: {
                    ...settings.notifications,
                    enabled: value
                  } 
                })}
                trackColor={{ false: colors.progressBar.background, true: colors.tint }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#f4f3f4'}
              />
            </View>
            
            {/* 勉強中は通知を消す */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                学習中は他の通知を非表示
              </Text>
              <Switch
                value={settings.notifications.doNotDisturb}
                onValueChange={(value) => saveSettings({ 
                  notifications: {
                    ...settings.notifications,
                    doNotDisturb: value
                  } 
                })}
                trackColor={{ false: colors.progressBar.background, true: colors.tint }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#f4f3f4'}
              />
            </View>
          </View>
        </View>
        
        {/* アプリ情報 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            アプリ情報
          </Text>
          
          <View style={[styles.settingCard, { backgroundColor: colors.card.background, borderColor: colors.card.border }]}>
            {/* バージョン */}
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                バージョン
              </Text>
              <Text style={[styles.settingValue, { color: colors.tabIconDefault }]}>
                {Application.nativeApplicationVersion}
              </Text>
            </View>
            
            {/* プライバシーポリシー */}
            <TouchableOpacity
              style={styles.settingLink}
              onPress={() => Linking.openURL('https://example.com/privacy')}
            >
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                プライバシーポリシー
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
            </TouchableOpacity>
            
            {/* 利用規約 */}
            <TouchableOpacity
              style={styles.settingLink}
              onPress={() => Linking.openURL('https://example.com/terms')}
            >
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                利用規約
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
            </TouchableOpacity>
            
            {/* データリセット */}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetData}
            >
              <Text style={[styles.resetButtonText, { color: colors.button.danger }]}>
                すべてのデータをリセット
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* プレミアム */}
        {!settings.isPremium && (
          <View style={styles.section}>
            <View style={[styles.premiumCard, { backgroundColor: colors.tint }]}>
              <Text style={[styles.premiumTitle, { color: colors.button.text }]}>
                プレミアム版にアップグレード
              </Text>
              
              <Text style={[styles.premiumDescription, { color: colors.button.text }]}>
                すべての機能を使用するには、プレミアム版にアップグレードしてください。
              </Text>
              
              <TouchableOpacity
                style={[styles.premiumButton, { backgroundColor: colors.button.text }]}
                onPress={() => Linking.openURL('https://example.com/premium')}
              >
                <Text style={[styles.premiumButtonText, { color: colors.tint }]}>
                  詳細を見る
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  settingGroup: {
    marginBottom: 16,
  },
  settingGroupTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  themeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  themeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
  settingValue: {
    fontSize: 16,
  },
  slider: {
    width: '50%',
    height: 40,
  },
  settingLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  resetButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  premiumCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  premiumDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  premiumButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  premiumButtonText: {
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
});