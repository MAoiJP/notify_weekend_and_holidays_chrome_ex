# notify_weekend_and_holidays_chrome_ex

週末・祝日にブラウザを開いたとき、1日1回バナー通知するChrome拡張機能。

## 概要

| 項目 | 内容 |
|------|------|
| 通知タイミング | 週末・祝日にブラウザがアクティブになったとき（1日1回のみ） |
| 通知形式 | バナー通知（`chrome.notifications`） |
| 祝日データ | Google カレンダー API（日本） |
| 認証方式 | OAuth 2.0（`chrome.identity`） |
| キャッシュ戦略 | なし（当日分をその都度取得） |

## ファイル構成

```
notify_weekend_and_holidays_chrome_ex/
├── manifest.json       # 拡張の設定
├── background.js       # メインロジック（Service Worker）
└── icons/
    └── icon128.png     # 拡張アイコン（仮）
```

## 動作フロー

1. `chrome.runtime.onStartup` または `onInstalled` イベントを検知
2. `chrome.storage.local` で今日すでに通知済みか確認
3. 通知済みならスキップ
4. 今日が土曜・日曜かどうか判定
5. `chrome.identity.getAuthToken()` でOAuthトークンを取得
6. Google カレンダー API で今日の祝日を取得
7. 週末または祝日なら `chrome.notifications.create()` でバナー通知
8. `lastNotifiedDate` に今日の日付を保存

## 使用技術・API

- **Manifest V3** — Chrome拡張の最新仕様
- **Service Worker**（background.js） — バックグラウンド処理
- **chrome.notifications** — バナー通知
- **chrome.storage.local** — 通知済み日付の永続化
- **chrome.identity** — OAuth 2.0認証
- **Google Calendar API** — 日本の祝日データ取得

### 祝日APIエンドポイント

```
https://www.googleapis.com/calendar/v3/calendars/
  ja.japanese%23holiday%40group.v.calendar.google.com/events
  ?timeMin=...&timeMax=...&singleEvents=true
```

認証はAPIキーではなく `Authorization: Bearer <token>` ヘッダーで行う。

## セットアップ

```bash
gh repo clone MAoiJP/notify_weekend_and_holidays_chrome_ex
cd notify_weekend_and_holidays_chrome_ex
```

### Google Cloud Console の設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. **Google Calendar API** を有効化
3. **認証情報 → OAuthクライアントID** を作成（アプリの種類: Chrome拡張機能）
4. 拡張機能のIDを登録（下記参照）
5. **OAuth同意画面 → テストユーザー** に自分のGmailアドレスを追加
6. 発行されたクライアントIDを `manifest.json` の `oauth2.client_id` に設定

### 拡張機能IDの固定

`manifest.json` に `key` フィールドを追加することでIDを固定できる。

```bash
openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out key.pem
openssl rsa -in key.pem -pubout -outform DER | openssl base64 -A
```

出力された文字列を `manifest.json` の `"key"` に設定する。`key.pem` はgitに含めないこと。

### Chromeへの読み込み

1. `chrome://extensions/` を開く
2. **デベロッパーモード** をON
3. **パッケージ化されていない拡張機能を読み込む** をクリック
4. このフォルダを選択
5. 初回起動時にGoogleアカウントの認証を求められるので許可する

### macOSの通知設定

**システム設定 → 通知 → Google Chrome** で通知を許可する。

## 今後のTODO

- [ ] 通知メッセージの文言をカスタマイズする
  - [ ] 通知メッセージをユーザーがカスタマイズできるようにする
- [ ] Chrome Web Storeへの公開を検討する（公開時はOAuthクライアントIDにストアIDを追加登録）
