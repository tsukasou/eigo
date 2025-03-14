import * as Speech from 'expo-speech';

/**
 * テキスト読み上げサービス
 * 
 * このモジュールは以下の機能を提供します:
 * - テキストを音声で読み上げる
 * - 読み上げを停止する
 * - 読み上げ可能な言語を取得する
 */

/**
 * テキストを音声で読み上げる
 * 
 * @param text - 読み上げるテキスト
 * @param options - 読み上げオプション（言語、速度、音量など）
 * @returns 読み上げが開始されたかどうか
 */
export async function speak(
  text: string, 
  options?: Speech.SpeechOptions
): Promise<boolean> {
  try {
    // デフォルトのオプションと指定されたオプションをマージ
    const defaultOptions: Speech.SpeechOptions = {
      language: 'en-US',  // デフォルトは英語
      pitch: 1.0,         // 音の高さ（1.0が標準）
      rate: 0.8,          // 速度（1.0が標準、少し遅めに設定）
      volume: 1.0,        // 音量（1.0が最大）
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // 既に読み上げ中の場合は停止
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }
    
    // テキストを読み上げる
    await Speech.speak(text, mergedOptions);
    return true;
  } catch (error) {
    console.error('音声読み上げエラー:', error);
    return false;
  }
}

/**
 * 読み上げを停止する
 * 
 * @returns 停止が成功したかどうか
 */
export async function stop(): Promise<boolean> {
  try {
    await Speech.stop();
    return true;
  } catch (error) {
    console.error('音声停止エラー:', error);
    return false;
  }
}

/**
 * 読み上げ中かどうかを確認
 * 
 * @returns 読み上げ中の場合はtrue
 */
export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    console.error('音声状態確認エラー:', error);
    return false;
  }
}

/**
 * 利用可能な言語の一覧を取得
 * 
 * @returns 言語の配列
 */
export async function getAvailableLanguages(): Promise<string[]> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.map(voice => voice.identifier);
  } catch (error) {
    console.error('利用可能な言語の取得エラー:', error);
    return [];
  }
}