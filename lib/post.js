'use strict';
// Node.jsからDBを扱うためのパッケージ(モジュール)sequelizeの読み込み
const Sequelize = require('sequelize');

// DBオブジェクトの作成
const sequelize = new Sequelize(
  'postgres://postgres:postgres@localhost/secret_board',
  { // DBの設定を渡す
    logging: false, // sequelizeが出すログ
    operatorsAliases: false // sequelizeの演算子エイリアス機能(?)
  });

// データモデルの定義(投稿データをPostオブジェクトとする)
const Post = sequelize.define('Post', {
  id: { // DBに登録するデータに付加する固有のIDについての設定
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true // IDに対するデータが一意に決まることを保証する(→データの高速参照が可能になる)
  },
  content: { // 投稿内容についての設定
    type: Sequelize.TEXT // 制限のない文字列を保存できる
  },
  postedBy: { // 投稿したユーザーの名前についての設定
    type: Sequelize.STRING // 256文字までの長さの文字列を保存できる
  },
  trackingCookie: { // ユーザーごとに付与したCookie値についての設定
    type: Sequelize.STRING
  }
}, {
  freezeTableName: true, //テーブル名をPostで固定
  timestamps: true // 投稿オブジェクトpostに、作成日時createdAtと更新日時updatedAtというデータを自動的に追加する
  });

// PostオブジェクトをDBに適用して同期をとる(←？)
Post.sync();
// オブジェクト自体をモジュール化
module.exports = Post;