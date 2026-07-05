# note 統計CSVダウンロード / note Stats CSV Downloader

[日本語](#日本語) | [English](#english)

---

## 日本語

### 概要
「note 統計CSVダウンロード」は、noteのダッシュボード（アクセス状況・統計ページ）のデータをCSVファイルとしてダウンロードできるブラウザ拡張機能（Manifest V3対応）です。Google ChromeやFirefoxなどで動作します。「もっとみる」ボタンを自動的にクリックして全データを展開し、BOM付きのUTF-8形式でCSV出力します。

### 特徴
- **全件自動展開**: 「もっとみる」ボタンを自動で繰り返しクリックし、ページ上のデータを全て表示させてからCSVを作成します（最大100回クリックの安全上限を設定）。
- **文字化け対策**: Excelなどで開いても文字化けしにくい「BOM付きUTF-8」で出力します。
- **自動タイムスタンプ**: `note_stats_YYYYMMDDHHMM.csv` の形式で、ダウンロードした日時のタイムスタンプをファイル名に自動付与します。
- **安全設計**: ダウンロード処理中にユーザーが別のページに移動した場合、処理を自動で中断します。

### インストール方法

#### Google Chrome の場合
1. 本リポジトリをクローンするか、ZIPファイルとしてダウンロードして解凍します。
2. Google Chromeを開き、アドレスバーに `chrome://extensions/` と入力して拡張機能管理ページを開きます。
3. 画面右上にある **「デベロッパー モード」** をオンにします。
4. **「パッケージ化されていない拡張機能を読み込む」** ボタンをクリックします。
5. 解凍したフォルダ（`manifest.json` が含まれるディレクトリ）を選択します。

#### Firefox の場合
1. 本リポジトリをクローンするか、ZIPファイルとしてダウンロードして解凍します。
2. Firefoxを開き、アドレスバーに `about:debugging` と入力します。
3. 左メニューの **「この Firefox」** をクリックします。
4. 一時的なアドオンセクションにある **「一時的なアドオンを読み込む...」** ボタンをクリックします。
5. 解凍したフォルダ内の `manifest.json` ファイルを選択します。

### 使い方
1. noteにログインし、[アクセス状況ページ](https://note.com/sitesettings/stats) にアクセスします。
2. 表（テーブル）の上に緑色の **「CSV形式でダウンロード（全件表示）」** ボタンが表示されます。
3. ボタンをクリックすると、データが自動で展開され（「データ展開中...」と表示されます）、完了後にCSVファイルが自動的にダウンロードされます。

---

## English

### Overview
**note Stats CSV Downloader** is a browser extension (Manifest V3) that runs on Google Chrome, Firefox, and other compatible browsers, allowing you to download your access statistics data from the note dashboard as a CSV file. It automatically clicks the "Show More" (もっとみる) button to expand all available data before exporting it as a UTF-8 CSV with BOM.

### Features
- **Auto-expand Data**: Repeatedly clicks the "Show More" button automatically to reveal all historical statistics before generating the CSV (safeguard limit set to a maximum of 100 clicks).
- **No Character Encoding Issues**: Exports the CSV in UTF-8 format with BOM (Byte Order Mark) to ensure it opens correctly in software like Microsoft Excel without garbled text.
- **Timestamped Filenames**: Saved files are named automatically using the format `note_stats_YYYYMMDDHHMM.csv` based on the download date and time.
- **Safety Measures**: Automatically stops loading data if the user navigates away from the page during the process.

### Installation

#### For Google Chrome
1. Clone this repository or download it as a ZIP file and extract it.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** toggle in the top-right corner.
4. Click the **"Load unpacked"** button in the top-left corner.
5. Select the folder containing this extension (the directory where `manifest.json` is located).

#### For Firefox
1. Clone this repository or download it as a ZIP file and extract it.
2. Open Firefox and navigate to `about:debugging`.
3. Click on **"This Firefox"** in the left menu.
4. Click the **"Load Temporary Add-on..."** button.
5. Select the `manifest.json` file inside the extracted folder.

### How to Use
1. Log in to note and go to your [Stats / Analytics page](https://note.com/sitesettings/stats).
2. A green button labeled **「CSV形式でダウンロード（全件表示）」** will appear above the statistics table.
3. Click the button. The extension will expand all rows (displaying "データ展開中..." / "Loading data...") and automatically download the CSV file once completed.

---

## ライセンス / License
This project is licensed under the [MIT License](LICENSE).
