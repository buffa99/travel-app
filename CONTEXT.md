# ToDoトラベル - プロジェクト引き継ぎファイル

このファイルを読めば、どのデバイスのClaudeでも即座に開発を再開できます。

---

## 基本情報

| 項目 | 内容 |
|---|---|
| アプリ名 | ToDoトラベル |
| 公開URL | https://buffa99.github.io/travel-app/ |
| GitHubリポジトリ | https://github.com/buffa99/travel-app |
| ローカルパス | C:\Users\SG030\OneDrive\Desktop\ToDoトラベル\travel-app\ |
| 技術スタック | Vanilla JS / HTML / CSS（フレームワークなし） |
| データ保存 | localStorage（キー: travel_plans_v1） |

---

## ファイル構成

```
travel-app/
├── index.html       # UI・モーダル・ビュー定義
├── app.js           # 全ロジック（約2500行）
├── style.css        # スタイル
├── manifest.json    # PWA設定
├── sw.js            # サービスワーカー（現在 travel-plan-v2）
└── CONTEXT.md       # このファイル
```

---

## 主な機能

- **プラン管理**: 複数の旅行プランを作成・編集・削除
- **スポット管理**: 観光地・グルメ・宿泊などをカテゴリ分けして登録
- **着/発時刻表示**: 最初のスポットは「発」のみ、2番目以降は「着」「発」両方
- **滞在時間入力**: 分単位で入力、次のスポットの着時刻に自動反映
- **移動時間入力**: 直接入力（手入力）方式、「地図を開く→」リンク付き
- **移動モード**: 公共交通・車・徒歩・待機の4種類
- **ドラッグ並び替え**: スポットの順序をドラッグ＆ドロップで変更
- **ルートメモ**: スポット間に経路メモ・画像（Ctrl+V貼り付け）を追加
- **天気予報**: OpenWeatherMap API（旅行5日前から表示）
- **Yahoo!天気リンク**: 目的地のYahoo天気へのリンク
- **Excel/CSVインポート**: スポットデータを一括インポート
- **PDF印刷**: 旅程をPDFとして印刷
- **JSON保存/読込**: プラン全体をJSONファイルで保存・読込
- **PWA対応**: スマホのホーム画面に追加して使用可能
- **画像自動圧縮**: 貼り付け画像を自動圧縮（localStorage容量節約）

---

## 重要な実装メモ

### データ構造
```javascript
plan = {
  id, name, startDate, endDate, city,
  days: [{ date, city, spots: [...], manualSort }],
  routes: { "spotId__spotId": { mode, travelMin, memo, image } }
}
```

### 主要関数
| 関数名 | 役割 |
|---|---|
| `renderSpotList(plan)` | スポット一覧を描画 |
| `saveSpot(btn)` | スポット編集を保存 |
| `applyOneStep(routeRow, mins)` | 移動時間を入力して次スポットの時刻を更新 |
| `initDragSort(container, plan)` | ドラッグ並び替え初期化 |
| `compressImage(dataUrl, maxPx, quality)` | 画像圧縮 |
| `compressAllStoredImages()` | 起動時に既存画像を一括圧縮 |
| `fetchWeather(plan)` | 天気予報取得・表示 |
| `importFromExcelFile(file)` | Excel/CSVインポート |
| `refreshAllTimes()` | 全スポットの時刻を一括再計算 |

### API
| API | 用途 | 制限 |
|---|---|---|
| OpenWeatherMap | 天気予報 | 5日先まで、APIキーあり |
| Nominatim | ジオコーディング | 1req/秒（_geoQueueで制御） |
| Yahoo!天気 | 天気確認リンク | リンクのみ |

### サービスワーカーのキャッシュ
コードを修正してGitHubに反映した後、キャッシュが古いまま残ることがある。
その場合は `sw.js` の `CACHE = 'travel-plan-vX'` のバージョン番号を上げてpushする。
現在のバージョン: **v2**

---

## GitHubへの反映方法（Claude Code用）

```bash
# ファイルをコピーしてpush
cp "C:/Users/SG030/OneDrive/Desktop/ToDoトラベル/travel-app/app.js" /tmp/travel-app-upload/app.js
cp "C:/Users/SG030/OneDrive/Desktop/ToDoトラベル/travel-app/style.css" /tmp/travel-app-upload/style.css
cp "C:/Users/SG030/OneDrive/Desktop/ToDoトラベル/travel-app/index.html" /tmp/travel-app-upload/index.html
cd /tmp/travel-app-upload
git add .
git commit -m "Update files"
git push
```

※ gh CLI認証済みであること。未認証の場合は `gh auth login` を実行。
※ 自宅PCでは /tmp/travel-app-upload を再クローンする必要あり:
```bash
gh repo clone buffa99/travel-app /tmp/travel-app-upload
```

---

## 既知の課題・今後の改善候補

- [ ] スポット削除後に着/発時刻がずれる場合がある
- [ ] ルートメモのクリアボタンで画像が消えないことがある
- [ ] 天気予報の説明文がAPIエラー時に非表示になる問題（v2で修正済み）
- [ ] 移動時間「ポイント」表示はブラウザオートコンプリートの誤動作（autocomplete="off"で対応済み）

---

## ユーザー情報

- PCユーザー（Windows 11）、スマホでも使用
- 非エンジニアだが積極的に開発参加
- シンプルな操作を好む（余分なボタン・機能は不要）
- 妻と旅行計画を立てるために使用
- 将来的に友人にも配布予定 → GitHub Pagesで公開済み
