/**
 * background.js の構造・品質検証テスト
 *
 * Chrome 拡張のため実行環境なしで静的解析として検証する。
 */

const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const BACKGROUND_JS_PATH = path.resolve(__dirname, "background.js");

let source = "";

describe("background.js", () => {
  before(() => {
    source = fs.readFileSync(BACKGROUND_JS_PATH, "utf-8");
  });

  // ─────────────────────────────────────────────────────────────
  // DRY 違反防止（family_tag: dry-violation）
  // isWeekend が new Date().getDay() を内部で呼ばず、
  // dayIndex を引数として受け取ることを保証する。
  // ─────────────────────────────────────────────────────────────
  describe("DRY 違反防止: isWeekend の dayIndex 引数化", () => {
    it("isWeekend が引数 dayIndex を受け取るシグネチャで定義されていること", () => {
      assert.match(
        source,
        /function isWeekend\s*\(\s*dayIndex\s*\)/,
        "isWeekend は引数 dayIndex を持つ必要があります"
      );
    });

    it("isWeekend 関数内で new Date() を呼んでいないこと", () => {
      // isWeekend 関数本体を抽出して内部に new Date() がないことを確認
      const match = source.match(/function isWeekend\s*\([^)]*\)\s*\{([^}]*)\}/);
      assert.ok(match, "isWeekend 関数が見つかりません");
      const body = match[1];
      assert.ok(
        !body.includes("new Date()"),
        "isWeekend 内で new Date() を呼んではいけません（DRY 違反）"
      );
    });

    it("checkAndNotify 内で new Date().getDay() が 1 回だけ呼ばれていること", () => {
      // checkAndNotify 関数本体を抽出
      const match = source.match(
        /async function checkAndNotify\s*\(\s*\)\s*\{([\s\S]*?)^\}/m
      );
      assert.ok(match, "checkAndNotify 関数が見つかりません");
      const body = match[1];
      const occurrences = (body.match(/new Date\(\)\.getDay\(\)/g) || []).length;
      assert.strictEqual(
        occurrences,
        1,
        `checkAndNotify 内で new Date().getDay() は 1 回だけ呼ぶこと（現在: ${occurrences} 回）`
      );
    });
  });
});
