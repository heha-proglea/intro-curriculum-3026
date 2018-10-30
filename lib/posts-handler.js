'use strict';
const pug = require('pug');
const Cookies = require('cookies');

// 日時をJSTに変換するライブラリMoment Timezoneを読み込む
const moment = require('moment-timezone');

const util = require('./handler-util');
const Post = require('./post');

// Cookie名の宣言
const trackingIdKey = 'tracking_id';

function handle(req, res) {
  // cookiesオブジェクトの作成
  const cookies = new Cookies(req, res);
  addTrackingCookie(cookies); // addTrackingCookie関数の呼び出し

  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      // requelizeにて投稿内容を取得する
      Post.findAll({ order: [['id', 'DESC']] }).then((posts) => { // sequelizeの関数findAllで、データを全件取得(引数orderにて並び順を逆に変更)する。thenの引数postsにはこのデータが入っている。
        posts.forEach((post) => {
          // DBから取得したデータの整形: 改行を使用可能にする
          post.content = post.content.replace(/\n/g, '<br>');

          // 投稿のオブジェクトに、フォーマットされた投稿日の属性formattedCreatedAtを用意
          post.formattedCreatedAt = moment(post.createdAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒'); // momentモジュールを使い、.tzでタイムゾーンの設定、.formatでフォーマット指定

        });
        // 投稿データを描画する
        res.end(pug.renderFile('./views/posts.pug', { // pugテンプレートからレンダリングしたものをHTTPレスポンスボディに出力
          // pugにデータを渡す
          posts: posts, // 上記FindAllにてDBから取得した全投稿データposts
          user: req.user // リクエストしたユーザー名req.user
        }));
        console.info(
          `閲覧されました: user: ${req.user}, ` +
          `trackinId: ${cookies.get(trackingIdKey) },` +
          `remoteAddress: ${req.connection.remoteAddress}, ` +
          `userAgent: ${req.headers['user-agent']} `
          );
      });
      break;
    case 'POST':
      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', () => {
        body = Buffer.concat(body).toString();
        const decoded = decodeURIComponent(body);
        const content = decoded.split('content=')[1];
        console.info('投稿されました: ' + content);
        // 投稿内容をDB上に保存する
        Post.create({
          content: content, // 投稿内容
          trackingCookie: cookies.get(trackingIdKey), // ※ Cookieより取得したtrackingId
          postedBy: req.user // 投稿者名
        }).then(() => {
          // 上記処理(DBへの保存)終了後、/postsへリダイレクト(ステータスコード303を返す)
          handleRedirectPosts(req, res);
        });
      });
      break;
    default:
      // そのメソッドに対する処理が未実装だった場合、ステータスコード400を返す
      util.handleBadRequest(req, res);
      break;
  }
}

// 投稿を削除する関数
function handleDelete(req, res) {
  switch (req.method) {
    // POSTメソッドの時だけ、処理を行う
    case 'POST':
      let body = [];
      req.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', () => { // 以上3行で、POSTのデータを受け取る
        // データの整形
        body = Buffer.concat(body).toString();
        // URIエンコードされたデータをデコード
        const decoded = decodeURIComponent(body);
        // 投稿者IDを取得
        const id = decoded.split('id=')[1];
        // sequelizeの文法に従って、削除を実装
        Post.findById(id).then((post) => { // 取得したIDから投稿を取得後、thenの引数のコールバック関数が呼ばれる。postには取得した投稿が入る
          // 投稿者本人または管理人に投稿削除の認可を与えるフラグ変数(サーバーサイドでの再確認)
          if (req.user === post.postedBy || req.user === 'admin') {
            // データを削除
            post.destroy();
            console.info(
              `削除されました: user: ${req.user}, ` +
              `remoteAddress: ${req.connection.remoteAddress}, ` +
              `userAgent: ${req.headers['user-agent']} `
              );
          }
          // 元のページへリダイレクト
          handleRedirectPosts(req, res);
        });
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

// トラッキングIDを作成し、Cookie内に保存する関数
function addTrackingCookie(cookies) {
  if (!cookies.get(trackingIdKey)) { // 「名前がtrackingIdKeyであるCookieの値」をget関数で取得。それがfalsyな場合(値が無い等)trueを返す
    // トラッキングID用に ランダムな指数値を生成
    const trackingId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    // 現在から24時間後のミリ秒を取得し、Dataオブジェクトに変換
    const tomorrow = new Date(new Date().getTime() + (1000 * 60 * 60 * 24));
    // トラッキングIDについて(Cookie名, Cookie値, { expires: 有効期限})の形で記述し、Cookieとして設定する(記述方法はcookiesモジュールのAPIに従っている)
    cookies.set(trackingIdKey, trackingId, { expires: tomorrow });
  }
}

// ステータスコード303: リダイレクト処理用の関数
function handleRedirectPosts(req, res) {
  res.writeHead(303, {
    'Location': '/posts'
  });
  res.end();
}

module.exports = {
  handle: handle,
  handleDelete: handleDelete
};
