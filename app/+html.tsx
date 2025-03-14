import { ScrollViewStyleReset } from 'expo-router/html';

/**
 * アプリ全体のHTMLヘッダー設定
 * 
 * このコンポーネントは:
 * - アプリのメタデータを設定
 * - 基本的なスタイルを構成
 * - アクセシビリティの設定を行う
 */
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover"
        />
        {/* アプリのタイトル */}
        <title>英単語アプリ</title>
        {/* アプリの説明 */}
        <meta
          name="description"
          content="忘却曲線に基づいて効率的に英単語を学習するアプリ"
        />
        {/*
          ScrollViewStyleReset は ScrollView コンポーネントのスタイルをリセットします。
          これにより、コンテンツが適切に表示されるようになります。
        */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveViewportStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

/**
 * レスポンシブなビューポートのスタイル設定
 * 
 * このスタイルは:
 * - 全体的なフォントとbox-sizingの基本設定
 * - スクロール動作の最適化
 * - ユーザー選択の防止（アプリらしい挙動にするため）
 */
const responsiveViewportStyle = `
html, body, #root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  overscroll-behavior: none;
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
  touch-action: manipulation;
}

/* iOSのテキスト選択を無効化 */
:root {
  -webkit-user-select: none;
  user-select: none;
}

:root, html, body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-tap-highlight-color: transparent;
  -webkit-text-size-adjust: 100%;
}

input, textarea {
  user-select: text;
  -webkit-user-select: text;
}
`;