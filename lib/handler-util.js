'use strict';
const fs = require('fs');

// ステータスコード401: ログアウト用の関数
function handleLogout(req, res) {
  res.writeHead(401, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  // res.end('ログアウトしました');
  // ログアウト時に、ログインボタンを設置する
  res.end('<!DOCTYPE html><html lang="ja"><body>' +
    '<h1>ログアウトしました</h1>' +
    '<a href="/posts">ログイン</a>' +
    '</body></html>');
}

// ステータスコード404: 指定されたファイルが見つからなかった時の関数
function handleNotFound(req, res) {
  res.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('ページがみつかりません');
}

// ステータスコード400: 未対応のメソッドが来た時の関数
function handleBadRequest(req, res) {
  res.writeHead(400, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('未対応のメソッドです');
}

// ファビコンを要求された時の処理の関数
function handleFavicon(req, res) {
  // ファビコンのコンテンツタイプをレスポンスヘッダに書き出し
  res.writeHead(200, {
    'Content-Type': 'image/vnd.microsoft.icon'
  });
  // ファビコンのファイルをStreamとして同期的に読み出す
  const favicon = fs.readFileSync('./favicon.ico');
  // 読み出したものをレスポンスの内容として書き出す
  res.end(favicon);
}

// 関数のモジュール化
module.exports = {
  handleLogout: handleLogout,
  handleNotFound: handleNotFound,
  handleBadRequest: handleBadRequest,
  handleFavicon: handleFavicon
};
