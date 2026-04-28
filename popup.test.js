/**
 * popup.js の構造・品質検証テスト（静的解析方式）
 */

const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const POPUP_JS_PATH = path.resolve(__dirname, "popup.js");
const BACKGROUND_JS_PATH = path.resolve(__dirname, "background.js");

let source = "";
let backgroundSource = "";

describe("popup.js", () => {
  before(() => {
    source = fs.readFileSync(POPUP_JS_PATH, "utf-8");
    backgroundSource = fs.readFileSync(BACKGROUND_JS_PATH, "utf-8");
  });

  // ─────────────────────────────────────────────────────────────
  // STORAGE_KEY 定数の一致（family_tag: storage-key-consistency）
  // background.js と popup.js で同じキー名を使うことを保証する。
  // ─────────────────────────────────────────────────────────────
  describe("STORAGE_KEY 定数の定義と background.js との一致", () => {
    it("STORAGE_KEY 定数が定義されていること", () => {
      assert.match(
        source,
        /const STORAGE_KEY\s*=\s*["'][^"']+["']/,
        "popup.js に STORAGE_KEY 定数が必要です"
      );
    });

    it("popup.js と background.js の STORAGE_KEY 値が一致していること", () => {
      const popupMatch = source.match(/const STORAGE_KEY\s*=\s*["']([^"']+)["']/);
      const bgMatch = backgroundSource.match(/const STORAGE_KEY\s*=\s*["']([^"']+)["']/);
      assert.ok(popupMatch, "popup.js に STORAGE_KEY が見つかりません");
      assert.ok(bgMatch, "background.js に STORAGE_KEY が見つかりません");
      assert.strictEqual(
        popupMatch[1],
        bgMatch[1],
        `STORAGE_KEY の値が一致しません（popup: "${popupMatch[1]}", background: "${bgMatch[1]}"）`
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // ストレージ読み込み（family_tag: storage-read）
  // ─────────────────────────────────────────────────────────────
  describe("DOMContentLoaded 時のストレージ読み込み", () => {
    it("DOMContentLoaded リスナーが登録されていること", () => {
      assert.match(
        source,
        /addEventListener\s*\(\s*["']DOMContentLoaded["']/,
        "DOMContentLoaded リスナーが必要です"
      );
    });

    it("chrome.storage.local.get を STORAGE_KEY で呼んでいること", () => {
      assert.match(
        source,
        /chrome\.storage\.local\.get\s*\(\s*STORAGE_KEY/,
        "chrome.storage.local.get(STORAGE_KEY, ...) の呼び出しが必要です"
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // ストレージ書き込み（family_tag: storage-write）
  // ─────────────────────────────────────────────────────────────
  describe("保存ボタンクリック時のストレージ書き込み", () => {
    it("chrome.storage.local.set を STORAGE_KEY で呼んでいること", () => {
      assert.match(
        source,
        /chrome\.storage\.local\.set\s*\(\s*\{\s*\[STORAGE_KEY\]/,
        "chrome.storage.local.set({ [STORAGE_KEY]: ... }) の呼び出しが必要です"
      );
    });

    it("保存成功フィードバックのテキストが含まれていること", () => {
      assert.ok(
        source.includes("保存しました"),
        "保存成功時のフィードバックテキスト「保存しました」が必要です"
      );
    });
  });
});
