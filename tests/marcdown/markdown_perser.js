// markdown.js

// 1. トークン種別
const TokenType = {
  TEXT: 'TEXT',
  BOLD: 'BOLD',
  ITALIC: 'ITALIC',
  CODE: 'CODE',
  LINK: 'LINK',
  IMAGE: 'IMAGE',
  HEADING: 'HEADING',
  LIST_ITEM: 'LIST_ITEM',
  NEWLINE: 'NEWLINE',
  EOF: 'EOF'
};

// 2. とても単純なレキサー（トークナイザー）
function tokenize(markdown) {
  const tokens = [];
  let i = 0;
  const len = markdown.length;

  function peek() { return i < len ? markdown[i] : null; }
  function consume() { return i < len ? markdown[i++] : null; }

  while (i < len) {
    let ch = peek();

    // 改行
    if (ch === '\n') {
      consume();
      tokens.push({ type: TokenType.NEWLINE });
      continue;
    }

    // 見出し # 
    if (ch === '#' && (i === 0 || markdown[i-1] === '\n')) {
      let level = 0;
      while (peek() === '#') {
        consume();
        level++;
      }
      if (level <= 6 && peek() === ' ') {
        consume(); // スペース
        let text = '';
        while (peek() && peek() !== '\n') {
          text += consume();
        }
        tokens.push({
          type: TokenType.HEADING,
          level: Math.min(level, 6),
          text: text.trim()
        });
        continue;
      }
    }

    // リスト - * +
    if ((ch === '-' || ch === '*' || ch === '+') &&
        (i === 0 || markdown[i-1] === '\n') &&
        markdown[i+1] === ' ') {
      consume();
      consume(); // スペース
      let text = '';
      while (peek() && peek() !== '\n') {
        text += consume();
      }
      tokens.push({
        type: TokenType.LIST_ITEM,
        ordered: false,
        text: text.trim()
      });
      continue;
    }

    // インライン要素をパースするためのバッファ
    let text = '';

    while (i < len) {
      ch = peek();

      if (ch === '\n') break;

      // **太字** または __太字__
      if ((ch === '*' || ch === '_') && markdown[i+1] === ch) {
        if (text) {
          tokens.push({ type: TokenType.TEXT, value: text });
          text = '';
        }
        consume(); consume();
        let content = '';
        while (i < len) {
          if (peek() === ch && markdown[i+1] === ch) {
            consume(); consume();
            break;
          }
          content += consume();
        }
        tokens.push({ type: TokenType.BOLD, children: parseInline(content) });
        continue;
      }

      // *斜体* または _斜体_
      if ((ch === '*' || ch === '_') && markdown[i+1] !== ch) {
        if (text) {
          tokens.push({ type: TokenType.TEXT, value: text });
          text = '';
        }
        consume();
        let content = '';
        while (i < len) {
          if (peek() === ch && markdown[i+1] !== ch) {
            consume();
            break;
          }
          content += consume();
        }
        tokens.push({ type: TokenType.ITALIC, children: parseInline(content) });
        continue;
      }

      // `コード`
      if (ch === '`') {
        if (text) {
          tokens.push({ type: TokenType.TEXT, value: text });
          text = '';
        }
        consume();
        let content = '';
        while (i < len && peek() !== '`') {
          content += consume();
        }
        if (peek() === '`') consume();
        tokens.push({ type: TokenType.CODE, value: content });
        continue;
      }

      // ![画像](url)   または   [リンク](url)
      if (ch === '!' || ch === '[') {
        if (text) {
          tokens.push({ type: TokenType.TEXT, value: text });
          text = '';
        }
        const isImage = ch === '!';
        if (isImage) consume(); // !
        if (peek() !== '[') { text += ch; continue; }
        consume(); // [

        let alt = '';
        while (i < len && peek() !== ']') {
          alt += consume();
        }
        if (peek() === ']') consume();
        if (peek() !== '(') { 
          tokens.push({ type: TokenType.TEXT, value: isImage ? '!' : '' + '[' + alt + ']' });
          continue;
        }
        consume(); // (

        let url = '';
        while (i < len && peek() !== ')') {
          url += consume();
        }
        if (peek() === ')') consume();

        tokens.push({
          type: isImage ? TokenType.IMAGE : TokenType.LINK,
          alt: alt.trim(),
          url: url.trim()
        });
        continue;
      }

      // それ以外はテキストとして蓄積
      text += consume();
    }

    if (text) {
      tokens.push({ type: TokenType.TEXT, value: text.trimEnd() });
    }
  }

  tokens.push({ type: TokenType.EOF });
  return tokens;
}

// 再帰的にインラインをパース（**や*の中身用）
function parseInline(text) {
  const subTokens = tokenizeInline(text);
  return subTokens;
}

// インライン専用ミニレキサー（再帰用）
function tokenizeInline(str) {
  // 簡略化のため、ここでは再帰呼び出しを避けて簡易実装
  // 本当はもう少し丁寧にやるべきですが…
  return [{ type: TokenType.TEXT, value: str }];
  // ↑実際はここに ** * ` [ などのパースを再帰的に入れる
}

// 3. 簡易HTMLレンダラー
function tokensToHtml(tokens) {
  let html = '';
  let inList = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    switch (t.type) {
      case TokenType.HEADING:
        html += `<h${t.level}>${escapeHtml(t.text)}</h${t.level}>\n`;
        break;

      case TokenType.LIST_ITEM:
        if (!inList) {
          html += '<ul>\n';
          inList = true;
        }
        html += `<li>${escapeHtml(t.text)}</li>\n`;
        break;

      case TokenType.NEWLINE:
        // 連続改行で段落区切りなど（簡易）
        if (tokens[i+1]?.type === TokenType.NEWLINE) {
          if (inList) {
            html += '</ul>\n';
            inList = false;
          }
          html += '<p></p>'; // 空行 → 段落区切り（雑）
        }
        break;

      case TokenType.TEXT:
        html += escapeHtml(t.value);
        break;

      case TokenType.BOLD:
        html += `<strong>${t.children.map(c => c.value).join('')}</strong>`;
        break;

      case TokenType.ITALIC:
        html += `<em>${t.children.map(c => c.value).join('')}</em>`;
        break;

      case TokenType.CODE:
        html += `<code>${escapeHtml(t.value)}</code>`;
        break;

      case TokenType.LINK:
        html += `<a href="${escapeHtml(t.url)}">${escapeHtml(t.alt)}</a>`;
        break;

      case TokenType.IMAGE:
        html += `<img src="${escapeHtml(t.url)}" alt="${escapeHtml(t.alt)}">`;
        break;
    }
  }

  if (inList) html += '</ul>\n';

  return html.trim();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 使用例
function simpleMarkdownToHtml(md) {
  const tokens = tokenize(md);
  return tokensToHtml(tokens);
}

// ──────────────────────────────────────
// テスト
// ──────────────────────────────────────

const sample = `
# Hello World

これは**太字**と*斜体*と\`コード\`のテストです。

[Google](https://google.com)

![猫](https://example.com/cat.jpg)

- りんご
- みかん
- バナナ

こんにちは  
改行しました
`;

console.log(simpleMarkdownToHtml(sample));