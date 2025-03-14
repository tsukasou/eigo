import { ResponseType, StudyLog } from '@/types';

/**
 * 忘却曲線に基づく間隔反復アルゴリズム
 * 
 * このモジュールでは、ユーザーの回答に基づいて次の復習日を計算します。
 * SuperMemoのSM-2アルゴリズムをベースにした実装です。
 */

// デフォルトの復習間隔（ミリ秒）
const DEFAULT_INTERVALS = {
  [ResponseType.WRONG]: 1000 * 60 * 60,         // 間違えた: 1時間後
  [ResponseType.AGAIN]: 1000 * 60 * 60 * 6,     // もう一度: 6時間後
  [ResponseType.HARD]: 1000 * 60 * 60 * 24,     // 難しい: 1日後
  [ResponseType.CORRECT]: 1000 * 60 * 60 * 24 * 3, // 正解: 3日後
  [ResponseType.EASY]: 1000 * 60 * 60 * 24 * 7, // 簡単: 7日後
};

// デフォルトの間隔乗数
const DEFAULT_MULTIPLIERS = {
  [ResponseType.WRONG]: 1.1,    // 間違えた
  [ResponseType.AGAIN]: 1.2,    // もう一度
  [ResponseType.HARD]: 1.5,     // 難しい
  [ResponseType.CORRECT]: 2.0,  // 正解
  [ResponseType.EASY]: 2.5,     // 簡単
};

// 各回答タイプに応じた成功度（0-5のスケール）
const EASE_FACTORS = {
  [ResponseType.WRONG]: 0,    // 間違えた
  [ResponseType.AGAIN]: 1,    // もう一度
  [ResponseType.HARD]: 2,     // 難しい
  [ResponseType.CORRECT]: 3,  // 正解
  [ResponseType.EASY]: 5,     // 簡単
};

/**
 * 次の復習日を計算する関数
 * 
 * @param cardId - カードID
 * @param responseType - ユーザーの回答の種類
 * @param previousLogs - このカードの過去の学習ログ（最新順）
 * @param intervals - 各回答タイプごとの基本間隔（ミリ秒）
 * @param multipliers - 各回答タイプごとの間隔乗数
 * @returns 次の復習日のタイムスタンプ
 */
export function calculateNextReviewDate(
  cardId: string,
  responseType: ResponseType,
  previousLogs: StudyLog[] = [],
  intervals = DEFAULT_INTERVALS,
  multipliers = DEFAULT_MULTIPLIERS
): number {
  // 現在の時刻
  const now = Date.now();
  
  // 基本間隔
  let interval = intervals[responseType];
  
  // このカードの過去のログを取得（最新のものから）
  const cardLogs = previousLogs.filter(log => log.cardId === cardId);
  
  // 過去のログがある場合
  if (cardLogs.length > 0) {
    // 最後の学習ログ
    const lastLog = cardLogs[0];
    // 前回の復習からの経過時間
    const timeSinceLastReview = now - lastLog.studiedAt;
    
    // 前回の復習からの経過日数
    const daysSinceLastReview = timeSinceLastReview / (1000 * 60 * 60 * 24);
    
    // 正確に復習日に復習できていれば乗数を上げる、そうでなければ下げる
    let adjustedMultiplier = multipliers[responseType];
    
    // 前回の予定復習日
    const scheduledReviewDate = lastLog.nextReviewDate;
    
    // 予定より早く復習した場合は乗数を少し下げる
    if (now < scheduledReviewDate) {
      adjustedMultiplier *= 0.9;
    }
    // 予定より大幅に遅れて復習した場合は乗数を下げる
    else if (now > scheduledReviewDate + 1000 * 60 * 60 * 24 * 7) {
      adjustedMultiplier *= 0.7;
    }
    
    // 連続して正解している場合、間隔を伸ばす
    let consecutiveCorrect = 0;
    for (const log of cardLogs) {
      if (log.responseType === ResponseType.CORRECT || log.responseType === ResponseType.EASY) {
        consecutiveCorrect++;
      } else {
        break;
      }
    }
    
    // 連続正解に基づいて間隔を調整
    if (consecutiveCorrect > 0) {
      const consecutiveFactor = 1 + (consecutiveCorrect * 0.1);
      adjustedMultiplier *= consecutiveFactor;
    }
    
    // 前回の間隔に乗数を掛ける
    const previousInterval = lastLog.nextReviewDate - lastLog.studiedAt;
    
    // 間違えた場合は初期間隔に戻す
    if (responseType === ResponseType.WRONG) {
      // 完全に忘れていた場合は初期間隔に戻す
      interval = intervals[ResponseType.WRONG];
    } else {
      // それ以外は前回の間隔に乗数を掛ける
      interval = Math.max(previousInterval * adjustedMultiplier, interval);
    }
  }
  
  // 最大間隔を6ヶ月に制限
  const MAX_INTERVAL = 1000 * 60 * 60 * 24 * 180; // 6ヶ月
  interval = Math.min(interval, MAX_INTERVAL);
  
  // 次の復習日を計算して返す
  return now + interval;
}

/**
 * 成功度（0-100）を計算する関数
 * 
 * @param responseType - ユーザーの回答の種類
 * @param responseTime - 回答にかかった時間（ミリ秒）
 * @returns 成功度（0-100のスケール）
 */
export function calculateSuccessRate(
  responseType: ResponseType,
  responseTime: number
): number {
  // 基本成功度（0-5のスケール）
  const baseFactor = EASE_FACTORS[responseType];
  
  // 応答時間による調整（長すぎると成功度が下がる）
  let timeFactor = 1.0;
  if (responseTime > 10000) { // 10秒以上かかった場合
    timeFactor = 0.9;
  } else if (responseTime > 20000) { // 20秒以上かかった場合
    timeFactor = 0.7;
  }
  
  // 最終的な成功度を計算（0-100のスケール）
  const successRate = (baseFactor / 5) * 100 * timeFactor;
  
  // 0-100の範囲に収める
  return Math.max(0, Math.min(100, successRate));
}

/**
 * 今日学習すべきカードの数を計算する関数
 * 
 * @param logs - すべての学習ログ
 * @param newCardsPerDay - 一日の新規カード数の上限
 * @param reviewCardsPerDay - 一日の復習カード数の上限
 * @param allCardIds - すべてのカードのID
 * @returns { newCardIds, reviewCardIds } - 今日学習すべき新規カードと復習カードのID配列
 */
export function calculateTodayCards(
  logs: StudyLog[],
  newCardsPerDay: number,
  reviewCardsPerDay: number,
  allCardIds: string[]
): { newCardIds: string[], reviewCardIds: string[] } {
  const now = Date.now();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = tomorrow.getTime();
  
  // 過去に学習したことのあるカードのIDを取得
  const studiedCardIds = new Set(logs.map(log => log.cardId));
  
  // まだ学習したことのない新規カードのIDを取得
  const newCardIds = allCardIds.filter(id => !studiedCardIds.has(id));
  
  // 今日の復習対象となるカードのIDを取得
  const reviewCardIds = Array.from(new Set(
    logs
      .filter(log => log.nextReviewDate <= now) // 復習予定日が現在以前のもの
      .filter(log => {
        // 今日既に学習済みのものを除外
        const todayLogs = logs.filter(l => 
          l.cardId === log.cardId && l.studiedAt >= todayStart && l.studiedAt < tomorrowStart
        );
        return todayLogs.length === 0;
      })
      .map(log => log.cardId)
  ));
  
  // 今日学習する新規カードと復習カードの数を制限
  return {
    newCardIds: newCardIds.slice(0, newCardsPerDay),
    reviewCardIds: reviewCardIds.slice(0, reviewCardsPerDay)
  };
}