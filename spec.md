# レッスンビューアー v2 技術仕様書

「レッスンビューアー v2」は、教育用ロボット教室向けのカリキュラム表示アプリケーションです。JSONベースの動的レンダリング、組み立て手順を表示する「ステップビューアー」、ミッションを視覚化する「ミッションシミュレーター」を備えています。

## 1. フォルダ構成

```text
LB_prototype/
├── spec.md                   # 本仕様書
└── courses/                  # コース管理ディレクトリ
    └── [course_id]/          # コース別フォルダ（例: challenger）
        ├── master_library/   # コース共通コンポーネント
        │   ├── robot.json    # ロボット・組み立て手順定義
        │   ├── mission.json  # ミッション内容・シミュレーター演出定義
        │   ├── learn.json    # 学びのポイント詳細
        │   ├── home.json     # ホームチャレンジ項目
        │   └── footer.json   # 共通フッター
        ├── script.js         # コース共通ロジック (Anime.js/ScrollReveal.js使用)
        ├── style.css         # デザイン定義 (CSS Variablesベース)
        ├── assets/           # コース内共通素材 (build/, mission/, hero/)
        └── [lesson_id]/      # レッスン別フォルダ（例: lesson_03）
            ├── index.html    # エントリポイント
            └── lesson_data.json # レッスン専用構成データ
```

## 2. データ構造 (JSON Schema)

### 2.1 セクションの種類とプロパティ

| セクション型 (`type`) | 説明 | 主なプロパティ |
| :--- | :--- | :--- |
| `hero` | トップ演出 | `title`, `description`, `characters` (位置・画像) |
| `point` | 学習のポイント | `title`, `items` (master_library/point.json の ID 配列) |
| `build` | 組み立て手順 | `parts` (画像シーケンス設定: `basePath`, `totalSteps`等) |
| `learn` | 詳細解説 | `items` (カード形式の解説、モーダル連動) |
| `mission_view` | ミッション表示 | `missionId` (mission.json参照), `displayPattern` (simulator等) |
| `home` | ホームミッション | `title`, `description`, `locking` (ロック解除演出対応) |

### 2.2 ミッションシミュレーター演出 (`demoAnimation`)
`mission.json` 内の `timeline` 配列で定義されます。
- `action`: `move` (移動), `wait` (待機), `stop` (停止)
- `effect`: `sensor_beam_green`, `sensor_beam_red`, `popup_text` (ピタッ！など)

## 3. 主要機能の仕様

### 3.1 ステップビューアー (Image Sequence Player)
- ローカルの連番画像（`step-1.png`...）を高速に切り替えて表示。
- **機能**: プリロード、進捗インジケーター、黄色のタクタイルボタンによる操作。

### 3.2 ミッションシミュレーター (Visual Sync)
- `Anime.js` を使用した動的なロボット移動アニメーション。
- センサー照射やテキストポップアップ等のエフェクトをタイムライン形式で同期。

### 3.3 ホームミッション・アンロック
- **ロック制御**: 初期状態では「おうちミッション」がブラー（ぼかし）と南京錠アイコンで保護。
- **解除条件**: ミッションレポートの「送信」ボタン押下により、物理的なアンロックアニメーション（Anime.js）が発動し、内容が表示される。

## 4. デザインシステム (UI/UX)

- **基本カラー**: メイン（水色: `#00b4dc`）、アクセント（黄色: `#ffd300`）、ダーク（ネイビー: `#003642`）。
- **スポットライト・エフェクト**:
    - 通常セクションは白背景のカードデザイン。
    - 重要な「ホームチャレンジ」等はダーク背景に黄色い境界線と発光、内部に白カードを配置し注目度を高める。
- **タクタイル・デザイン**: ボタンには 8px〜12px の底面シャドウを付け、押し込みアニメーションで「触感」を演出。

## 5. 技術スタック
- **ライブラリ**: [Anime.js](https://animejs.com/), [ScrollReveal.js](https://scrollrevealjs.org/), [Model-viewer](https://modelviewer.dev/) (3D対応用)
- **CSS**: Vanilla CSS (Custom Properties)
- **JS**: Vanilla JavaScript (ES6+ Class structure)

