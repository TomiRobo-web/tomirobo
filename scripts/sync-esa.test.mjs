// sync-esa.mjs のテスト。外部ネットワークは使わず、ローカルのモックサーバーと一時フォルダーだけで動く。
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { syncEsa } from './sync-esa.mjs';

const TOKEN = 'test-token';

/** モックの esa。pages（記事一覧）・images（"ホスト/パス" → 画像）・failure（API の異常応答）を差し替えて使う */
async function setup(t) {
  const state = { pages: [[]], images: {}, failure: null, requests: [] };
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const auth = req.headers.authorization;
    if (url.pathname.startsWith('/image/')) {
      const key = url.pathname.slice('/image/'.length);
      state.requests.push({ key, auth });
      const image = state.images[key];
      if (!image) return res.writeHead(404).end();
      if (image.private && auth !== `Bearer ${TOKEN}`) return res.writeHead(401).end();
      if (image.location) return res.writeHead(302, { location: image.location }).end();
      return res.writeHead(200, image.type ? { 'content-type': image.type } : {}).end(image.data);
    }
    state.requests.push({ key: url.pathname, auth, params: url.searchParams });
    if (state.failure) return res.writeHead(state.failure).end(JSON.stringify({ error: 'mock_failure' }));
    const page = Number(url.searchParams.get('page'));
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({
      posts: state.pages[page - 1] ?? [],
      next_page: page < state.pages.length ? page + 1 : null,
    }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const root = await mkdtemp(join(tmpdir(), 'sync-esa-'));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  });

  const base = `http://127.0.0.1:${server.address().port}`;
  const newsDir = join(root, 'news');
  const outDir = join(newsDir, 'esa');
  const imageDir = join(root, 'images');
  const options = {
    token: TOKEN,
    team: 'tomirobo',
    category: '/公開用/',
    allowEmpty: false,
    apiBase: base,
    outDir,
    imageDir,
    log: () => {},
    // esa の画像ホストへの通信をモックサーバーに向ける
    fetch: (input, init) => {
      const url = new URL(input);
      return fetch(url.origin === base ? url : `${base}/image/${url.host}${url.pathname}${url.search}`, init);
    },
  };
  return {
    state,
    newsDir,
    outDir,
    imageDir,
    sync: (extra = {}) => syncEsa({ ...options, ...extra }),
    readPost: (id) => readFile(join(outDir, `esa-${id}.md`), 'utf8'),
    readImage: (name) => readFile(join(imageDir, name), 'utf8'),
    snapshot: async () => ({ ...(await snapshot(newsDir)), ...(await snapshot(imageDir)) }),
  };
}

function post(number, overrides = {}) {
  return {
    number,
    name: `記事${number}`,
    body_md: `本文${number}`,
    wip: false,
    category: '公開用',
    tags: [],
    created_at: '2026-09-15T12:00:00+09:00',
    revision_number: 1,
    created_by: { name: '富山 太郎' },
    ...overrides,
  };
}

const png = (data) => ({ type: 'image/png', data });

/** フォルダー以下の全ファイルを { パス: 内容 } にする（変わっていないことの確認用） */
async function snapshot(dir) {
  if (!existsSync(dir)) return {};
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  const files = entries.filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name)).sort();
  return Object.fromEntries(await Promise.all(files.map(async (f) => [f, await readFile(f, 'utf8')])));
}

test('新規同期: 2ページ取得・フロントマター・画像の取り込み', async (t) => {
  const { state, sync, readPost, readImage, outDir, imageDir } = await setup(t);
  state.images = {
    'img.esa.io/uploads/a.png': png('PNG-A'),
    'files.esa.io/uploads/b': { type: 'image/jpeg; charset=binary', data: 'JPEG-B', private: true },
    'dl.esa.io/uploads/c.WEBP': { data: 'WEBP-C' },
  };
  state.pages = [
    [post(12, {
      name: '関東"夏"ロボコン: 報告 \\ #1',
      category: '公開用/技術ブログ/回路',
      tags: ['大会', '技術ブログ'],
      created_at: '2026-09-14T15:30:00Z',
      revision_number: 7,
      body_md: [
        '# 見出し',
        '![写真[1]](https://img.esa.io/uploads/a.png)',
        '![再掲](https://img.esa.io/uploads/a.png "題名")',
        '[![b](<https://files.esa.io/uploads/b>)](https://example.com/)',
        '<img width="10" alt="x > src=y" src="https://dl.esa.io/uploads/c.WEBP" />',
        '![外部](https://example.com/uploads/a.png)',
        '![偽物](https://img.esa.io.example.com/a.png)',
        '[リンク](https://img.esa.io/uploads/a.png)',
      ].join('\r\n'),
    })],
    [post(3, { category: '公開用/イベント', created_by: null, body_md: null, revision_number: undefined })],
  ];
  await sync();

  assert.deepEqual((await readdir(outDir)).sort(), ['esa-12.md', 'esa-3.md']);
  assert.equal(await readPost(12), [
    '---',
    'title: "関東\\"夏\\"ロボコン: 報告 \\\\ #1"',
    'date: 2026-09-15',
    'tags: ["大会","技術ブログ"]',
    'source: esa',
    'esa_id: 12',
    'revision: 7',
    'author: "富山 太郎"',
    '---',
    '',
    '# 見出し',
    '![写真[1]](/images/news/esa/esa-12-1.png)',
    '![再掲](/images/news/esa/esa-12-1.png "題名")',
    '[![b](/images/news/esa/esa-12-2.jpg)](https://example.com/)',
    '<img width="10" alt="x > src=y" src="/images/news/esa/esa-12-3.webp" />',
    '![外部](https://example.com/uploads/a.png)',
    '![偽物](https://img.esa.io.example.com/a.png)',
    '[リンク](https://img.esa.io/uploads/a.png)',
    '',
  ].join('\n'));
  const third = await readPost(3);
  assert.match(third, /^tags: \["イベント"\]$/m);
  assert.doesNotMatch(third, /^(author|revision):/m);

  assert.deepEqual((await readdir(imageDir)).sort(), ['esa-12-1.png', 'esa-12-2.jpg', 'esa-12-3.webp']);
  assert.equal(await readImage('esa-12-1.png'), 'PNG-A');
  assert.equal(await readImage('esa-12-2.jpg'), 'JPEG-B');

  const list = state.requests.filter((r) => r.key === '/v1/teams/tomirobo/posts');
  assert.deepEqual(list.map((r) => r.params.get('page')), ['1', '2']);
  assert.equal(list[0].params.get('q'), 'in:公開用 wip:false');
  assert.ok(list.every((r) => r.auth === `Bearer ${TOKEN}`));
  // トークンは 401 になった画像の再試行でだけ送る
  const images = state.requests.filter((r) => !r.key.startsWith('/'));
  assert.deepEqual(images.map((r) => [r.key, r.auth]), [
    ['img.esa.io/uploads/a.png', undefined],
    ['files.esa.io/uploads/b', undefined],
    ['files.esa.io/uploads/b', `Bearer ${TOKEN}`],
    ['dl.esa.io/uploads/c.WEBP', undefined],
  ]);
});

test('更新同期: 本文と revision を更新し、使われなくなった画像を消す', async (t) => {
  const { state, sync, readPost, readImage, imageDir } = await setup(t);
  state.images = {
    'img.esa.io/1.png': png('ONE'),
    'img.esa.io/2.png': png('TWO'),
    'img.esa.io/3.gif': { type: 'image/gif', data: 'THREE' },
  };
  state.pages = [[
    post(1, { body_md: '![](https://img.esa.io/1.png)\n![](https://img.esa.io/2.png)' }),
    post(11, { body_md: '![](https://img.esa.io/2.png)' }),
  ]];
  await sync();
  assert.deepEqual((await readdir(imageDir)).sort(), ['esa-1-1.png', 'esa-1-2.png', 'esa-11-1.png']);

  state.pages[0][0] = post(1, { body_md: '更新後\n\n![](https://img.esa.io/3.gif)', revision_number: 2 });
  await sync();
  assert.deepEqual((await readdir(imageDir)).sort(), ['esa-1-1.gif', 'esa-11-1.png']);
  assert.equal(await readImage('esa-1-1.gif'), 'THREE');
  const text = await readPost(1);
  assert.match(text, /^revision: 2$/m);
  assert.match(text, /更新後\n\n!\[\]\(\/images\/news\/esa\/esa-1-1\.gif\)\n$/);
});

test('公開取り消し: 対象外の記事と画像だけを消し、手動記事と legacy は変えない', async (t) => {
  const { state, sync, newsDir, outDir, imageDir } = await setup(t);
  state.images = { 'img.esa.io/p.png': png('P') };
  const body_md = '![](https://img.esa.io/p.png)';
  state.pages = [[1, 2, 3, 4, 5, 6].map((n) => post(n, { body_md }))];
  await sync();
  assert.equal((await readdir(outDir)).length, 6);

  const manual = {
    [join(newsDir, 'legacy', '2010-06-29.md')]: 'legacy 記事\r\n',
    [join(newsDir, 'esa-2.md')]: 'esa フォルダーの外にある手動記事',
    [join(outDir, 'manual.md')]: '手動記事',
    [join(outDir, 'esa-visit.md')]: '名前が esa- で始まる手動記事',
    [join(imageDir, 'photo.png')]: '手動の画像',
    [join(imageDir, 'esa-visit-1.png')]: '名前が esa- で始まる手動の画像',
  };
  await mkdir(join(newsDir, 'legacy'));
  for (const [file, text] of Object.entries(manual)) await writeFile(file, text);

  // API の検索条件をすり抜けて混入しても、スクリプト側の判定で除外されること（5 は esa 側で削除）
  state.pages = [[
    post(1, { body_md }),
    post(2, { body_md, wip: true }),
    post(3, { body_md, category: '内部/議事録' }),
    post(4, { body_md, category: 'Archived/公開用' }),
    post(6, { body_md, category: '公開用メモ' }),
    post(7, { body_md, category: null }),
    post(8, { body_md, wip: undefined }),
  ]];
  const result = await sync();
  assert.deepEqual(result.removedPosts.sort(), ['esa-2.md', 'esa-3.md', 'esa-4.md', 'esa-5.md', 'esa-6.md']);
  assert.deepEqual((await readdir(outDir)).sort(), ['esa-1.md', 'esa-visit.md', 'manual.md']);
  assert.deepEqual((await readdir(imageDir)).sort(), ['esa-1-1.png', 'esa-visit-1.png', 'photo.png']);
  for (const [file, text] of Object.entries(manual)) assert.equal(await readFile(file, 'utf8'), text);
});

test('空応答ガード: allowEmpty のときだけ全件を消す', async (t) => {
  const { state, sync, snapshot: take, outDir, imageDir } = await setup(t);
  await sync(); // 取り込み済みの記事がなければ0件でも成功する

  state.images = { 'img.esa.io/p.png': png('P') };
  state.pages = [[post(1, { body_md: '![](https://img.esa.io/p.png)' })]];
  await sync();
  const before = await take();
  assert.equal(Object.keys(before).length, 2);

  state.pages = [[]];
  await assert.rejects(sync({ allowEmpty: false }), /公開対象の記事が0件/);
  // 公開対象外の記事しか返らない場合も同じ
  state.pages = [[post(1, { wip: true })]];
  await assert.rejects(sync({ allowEmpty: 'false' }), /公開対象の記事が0件/);
  assert.deepEqual(await take(), before);

  await sync({ allowEmpty: true });
  assert.deepEqual(await readdir(outDir), []);
  assert.deepEqual(await readdir(imageDir), []);
});

test('エラー耐性: 取得に失敗したら既存の記事・画像を変えない', async (t) => {
  const { state, sync, snapshot: take } = await setup(t);
  state.images = { 'img.esa.io/p.png': png('P') };
  const original = post(1, { body_md: '![](https://img.esa.io/p.png)' });
  state.pages = [[original, post(2)]];
  await sync();
  const before = await take();
  assert.equal(Object.keys(before).length, 3);

  for (const status of [401, 403, 429, 500]) {
    state.failure = status;
    await assert.rejects(sync({ allowEmpty: true }), new RegExp(`HTTP ${status}.*mock_failure`));
    assert.deepEqual(await take(), before);
  }
  state.failure = null;

  // 画像の取得失敗（認証付きの再試行も失敗・画像ではない応答・https 以外への転送）
  const bad = [
    ['files.esa.io/denied.png', { private: true, data: '' }, /HTTP 401/, 'wrong-token'],
    ['files.esa.io/login.png', { type: 'text/html', data: '<html>' }, /対応していない形式/, TOKEN],
    ['files.esa.io/redirect.png', { location: 'http://example.com/a.png' }, /https ではありません/, TOKEN],
  ];
  for (const [key, image, message, token] of bad) {
    state.images[key] = image;
    state.pages = [[post(1, { body_md: '書き換え', revision_number: 9 }), post(3, { body_md: `![](https://${key})` })]];
    await assert.rejects(sync({ token }), message);
    assert.deepEqual(await take(), before);
  }

  // パストラバーサルになる記事番号
  state.pages = [[original, post('../../evil')]];
  await assert.rejects(sync(), /記事番号が不正/);
  assert.deepEqual(await take(), before);

  // 転送先が esa 以外のホストなら、認証付きの再試行でもトークンを送らない
  state.images['files.esa.io/moved.png'] = { location: 'https://cdn.example.com/moved.png' };
  state.images['cdn.example.com/moved.png'] = { private: true, data: '' };
  state.pages = [[post(3, { body_md: '![](https://files.esa.io/moved.png)' })]];
  await assert.rejects(sync(), /HTTP 401/);
  assert.deepEqual(await take(), before);
  const moved = state.requests.filter((r) => r.key === 'cdn.example.com/moved.png');
  assert.deepEqual(moved.map((r) => r.auth), [undefined, undefined]);
});

test('トークンの送信先: S3 には、直接の取得でも転送でも送らない', async (t) => {
  const { state, sync, snapshot: take, readImage } = await setup(t);
  const s3 = 'esa-storage-tokyo.s3-ap-northeast-1.amazonaws.com';
  const auths = (key) => state.requests.filter((r) => r.key === key).map((r) => r.auth);

  // esa のホストは 401 のあとトークン付きで再試行し、転送先の S3 には送らない
  const hosts = ['img.esa.io', 'files.esa.io', 'dl.esa.io'];
  for (const host of hosts) {
    state.images[`${host}/private`] = { private: true, location: `https://${s3}/${host}.png?signature=x` };
    state.images[`${s3}/${host}.png`] = png(`S3 ${host}`);
  }
  state.pages = [[post(1, { body_md: hosts.map((host) => `![](https://${host}/private)`).join('\n') })]];
  await sync();
  for (const [i, host] of hosts.entries()) {
    assert.deepEqual(auths(`${host}/private`), [undefined, `Bearer ${TOKEN}`]);
    assert.deepEqual(auths(`${s3}/${host}.png`), [undefined]);
    assert.equal(await readImage(`esa-1-${i + 1}.png`), `S3 ${host}`);
  }
  const before = await take();

  // S3 の URL が直接書かれていて 401 になっても送らない
  state.images[`${s3}/direct.png`] = { private: true, data: '' };
  state.pages = [[post(1, { body_md: `![](https://${s3}/direct.png)` })]];
  await assert.rejects(sync(), /HTTP 401/);

  // S3 を経由して esa 以外へ転送されても、S3 と転送先には送らない
  state.images['files.esa.io/chain'] = { private: true, location: `https://${s3}/chain` };
  state.images[`${s3}/chain`] = { location: 'https://cdn.example.com/chain.png' };
  state.images['cdn.example.com/chain.png'] = { private: true, data: '' };
  state.pages = [[post(1, { body_md: '![](https://files.esa.io/chain)' })]];
  await assert.rejects(sync(), /HTTP 401/);
  assert.deepEqual(auths('files.esa.io/chain'), [undefined, `Bearer ${TOKEN}`]);
  assert.deepEqual(auths(`${s3}/chain`), [undefined]);
  assert.deepEqual(auths('cdn.example.com/chain.png'), [undefined]);

  assert.deepEqual(await take(), before);
  assert.ok(state.requests.filter((r) => r.key.startsWith(`${s3}/`)).every((r) => r.auth === undefined));
});

test('画像の種類: Content-Type で分からなければ、転送後の URL の拡張子を使う', async (t) => {
  const { state, sync, readImage, imageDir } = await setup(t);
  const s3 = 'esa-storage-tokyo.s3-ap-northeast-1.amazonaws.com';
  state.images = {
    'files.esa.io/noext': { location: `https://${s3}/uploads/real.png?signature=x` },
    [`${s3}/uploads/real.png`]: { type: 'application/octet-stream', data: 'PNG' },
    // 転送後の URL に拡張子がないときは、本文に書かれた URL の拡張子
    'files.esa.io/photo.jpeg': { location: `https://${s3}/uploads/noext` },
    [`${s3}/uploads/noext`]: { type: 'binary/octet-stream', data: 'JPEG' },
  };
  state.pages = [[post(1, { body_md: '![](https://files.esa.io/noext)\n![](https://files.esa.io/photo.jpeg)' })]];
  await sync();
  assert.deepEqual((await readdir(imageDir)).sort(), ['esa-1-1.png', 'esa-1-2.jpg']);
  assert.equal(await readImage('esa-1-1.png'), 'PNG');
  assert.equal(await readImage('esa-1-2.jpg'), 'JPEG');
});

test('画像の大きさ: 20 MiB を超えたら中止する', async (t) => {
  const { state, sync, readPost, imageDir } = await setup(t);
  const limit = 20 * 1024 * 1024;
  const withImage = (body, headers = {}) => ({
    fetch: (input, init) => (new URL(input).host === 'img.esa.io'
      ? new Response(body, { headers: { 'content-type': 'image/png', ...headers } })
      : fetch(input, init)),
  });
  state.pages = [[post(1, { body_md: '![](https://img.esa.io/p.png)' })]];
  await sync(withImage(Buffer.alloc(limit)));
  const size = async () => (await readFile(join(imageDir, 'esa-1-1.png'))).length;
  assert.equal(await size(), limit);
  const before = await readPost(1);

  state.pages = [[post(1, { body_md: '更新後\n![](https://img.esa.io/p.png)' })]];
  const cases = [
    withImage('小さい本文', { 'content-length': String(limit + 1) }), // Content-Length が上限を超える
    withImage(Buffer.alloc(limit + 1)), // Content-Length がない
    withImage(Buffer.alloc(limit + 1), { 'content-length': '10' }), // Content-Length が実際より小さい
  ];
  for (const extra of cases) {
    await assert.rejects(sync(extra), /大きすぎます（上限 20 MiB）/);
    assert.equal(await size(), limit);
    assert.equal(await readPost(1), before);
  }
});

test('検索条件: 空白や記号を含むカテゴリ名は引用符で囲む', async (t) => {
  const { state, sync } = await setup(t);
  const cases = [
    ['公開用', 'in:公開用 wip:false'],
    ['公開用/技術ブログ', 'in:公開用/技術ブログ wip:false'],
    ['Public Posts', 'in:"Public Posts" wip:false'],
    ['公開　用', 'in:"公開　用" wip:false'],
    ['公開用(web)', 'in:"公開用(web)" wip:false'],
    ['a "b" \\c', 'in:"a \\"b\\" \\\\c" wip:false'],
  ];
  for (const [category, query] of cases) {
    state.requests = [];
    state.pages = [[post(1, { category })]];
    assert.deepEqual((await sync({ category })).posts, ['esa-1.md']);
    assert.equal(state.requests[0].params.get('q'), query);
  }
});
