// esa の「公開用」カテゴリの記事を src/content/news/esa/ に取り込む。
//   記事 → src/content/news/esa/esa-<記事番号>.md
//   画像 → public/images/news/esa/esa-<記事番号>-<連番>.<拡張子>
// 取得がすべて成功してから書き込み・削除をする（途中で失敗したら既存ファイルはそのまま）。
// 使い方と運用は docs/esa-sync.md を参照。
import { realpathSync } from 'node:fs';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const MAX_PAGES = 100;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 60_000;
// Cloudflare Workers Static Assets の上限（1ファイル 25 MiB）を超えないようにする
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

// esa の添付ファイルのホスト。本文中の画像のうち、ここにあるものだけを取り込む
const ESA_IMAGE_HOSTS = new Set([
  'img.esa.io',
  'esa-storage-tokyo.s3-ap-northeast-1.amazonaws.com',
  'files.esa.io',
  'dl.esa.io',
]);
// 画像の取得でトークンを送ってよいホスト。S3 は esa のサーバーではないので送らない
const ESA_TOKEN_HOSTS = new Set(['img.esa.io', 'files.esa.io', 'dl.esa.io']);

const EXT_BY_TYPE = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};
const URL_EXTS = { png: 'png', jpg: 'jpg', jpeg: 'jpg', gif: 'gif', webp: 'webp', svg: 'svg', avif: 'avif' };
// Content-Type から種類が分からないとき。この場合だけ URL の拡張子を使う
const GENERIC_TYPES = new Set(['', 'application/octet-stream', 'binary/octet-stream']);

const POST_FILE = /^esa-([1-9]\d*)\.md$/;
const IMAGE_FILE = /^esa-[1-9]\d*-/;

// 本文中の画像。1つ目の選択肢が Markdown 画像、2つ目が HTML の <img>
const IMAGE_PATTERN = new RegExp(
  [
    String.raw`(?<mdHead>!\[(?:\\.|\[[^\[\]]*\]|[^\[\]\\])*\]\(\s*)(?:<(?<mdAngle>[^<>\n]*)>|(?<mdBare>[^\s()<>]+(?:\([^\s()]*\)[^\s()<>]*)*))`,
    String.raw`(?<imgHead><img(?=\s)(?:"[^"]*"|'[^']*'|[^'">])*?\ssrc\s*=\s*)(?:"(?<imgDouble>[^"]*)"|'(?<imgSingle>[^']*)'|(?<imgBare>[^\s"'>]+))`,
  ].join('|'),
  'gi',
);

function readConfig(options) {
  const env = process.env;
  const token = String(options.token ?? env.ESA_ACCESS_TOKEN ?? '').trim();
  const team = String(options.team ?? env.ESA_TEAM ?? '').trim();
  const category = String(options.category ?? (env.ESA_PUBLIC_CATEGORY || '公開用')).trim().replace(/^\/+|\/+$/g, '');
  if (!token) throw new Error('ESA_ACCESS_TOKEN が設定されていません');
  if (!team) throw new Error('ESA_TEAM が設定されていません');
  if (!category) throw new Error('ESA_PUBLIC_CATEGORY が空です（全記事の公開を防ぐため中止）');
  return {
    token,
    team,
    category,
    allowEmpty: String(options.allowEmpty ?? env.ESA_ALLOW_EMPTY ?? 'false').trim().toLowerCase() === 'true',
    apiBase: String(options.apiBase ?? (env.ESA_API_BASE || 'https://api.esa.io')).replace(/\/+$/, ''),
    outDir: options.outDir ?? (env.ESA_OUT_DIR || join(ROOT, 'src/content/news/esa')),
    imageDir: options.imageDir ?? (env.ESA_IMAGE_DIR || join(ROOT, 'public/images/news/esa')),
    fetch: options.fetch ?? globalThis.fetch,
    log: options.log ?? console.log,
  };
}

async function request(config, url, headers, label) {
  try {
    // 転送先へトークンを送らないよう、リダイレクトは自動で追わない
    return await config.fetch(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (cause) {
    throw new Error(`${label}に接続できません: ${cause.cause?.message ?? cause.message}`, { cause });
  }
}

/** 検索条件の値。空白や記号で条件が分かれないよう、必要なときだけ引用符で囲む */
function quoteSearchValue(value) {
  return /[\s"'()|\\]/.test(value) ? `"${value.replace(/["\\]/g, '\\$&')}"` : value;
}

async function fetchPosts(config) {
  const query = encodeURIComponent(`in:${quoteSearchValue(config.category)} wip:false`);
  const posts = new Map(); // 取得中に更新されて2ページに重複した記事は1件にまとめる
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${config.apiBase}/v1/teams/${encodeURIComponent(config.team)}/posts?q=${query}&per_page=100&page=${page}&sort=updated&order=desc`;
    const res = await request(config, url, { Authorization: `Bearer ${config.token}` }, 'esa API ');
    const body = await res.text();
    if (!res.ok) {
      throw new Error(`esa API エラー: HTTP ${res.status}（page=${page}）: ${body.replace(/\s+/g, ' ').slice(0, 300)}`);
    }
    let data;
    try {
      data = JSON.parse(body);
    } catch (cause) {
      throw new Error(`esa API の応答が JSON ではありません（page=${page}）`, { cause });
    }
    if (!Array.isArray(data?.posts)) throw new Error(`esa API の応答に posts がありません（page=${page}）`);
    for (const post of data.posts) if (!posts.has(post.number)) posts.set(post.number, post);
    if (data.next_page == null) return [...posts.values()];
  }
  throw new Error(`esa の記事が ${MAX_PAGES} ページを超えました（無限ループ防止のため中止）`);
}

/** 公開してよい記事か。API の検索結果を信用せず、ここでもう一度確かめる */
function isPublic(post, category) {
  return post?.wip === false
    && (post.category === category || Boolean(post.category?.startsWith(`${category}/`)));
}

/** esa の添付画像なら取得用の URL を返す。それ以外は null */
function esaImageUrl(raw) {
  let url;
  try {
    url = new URL(raw.trim().replaceAll('&amp;', '&'), 'https://invalid.example/');
  } catch {
    return null;
  }
  if (url.protocol === 'http:') url.protocol = 'https:';
  // host はポート込みの比較（既定以外のポートは対象外）
  if (url.protocol !== 'https:' || !ESA_IMAGE_HOSTS.has(url.host)) return null;
  url.username = '';
  url.password = '';
  url.hash = '';
  return url.href;
}

/** 画像を取得し、応答と転送後の URL を返す */
async function requestImage(config, startUrl, withToken, label) {
  let url = new URL(startUrl);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const headers = withToken && ESA_TOKEN_HOSTS.has(url.host) ? { Authorization: `Bearer ${config.token}` } : {};
    const res = await request(config, url.href, headers, label);
    const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
    if (!location) return { res, finalUrl: url.href };
    await res.body?.cancel();
    url = new URL(location, url);
    if (url.protocol !== 'https:') throw new Error(`${label}の転送先が https ではありません`);
  }
  throw new Error(`${label}の転送が多すぎます`);
}

function imageExtension(url, contentType) {
  const type = (contentType ?? '').split(';')[0].trim().toLowerCase();
  if (Object.hasOwn(EXT_BY_TYPE, type)) return EXT_BY_TYPE[type];
  if (!GENERIC_TYPES.has(type)) return null; // ログイン画面の HTML などを画像として保存しない
  const ext = /\.([a-z0-9]+)$/i.exec(new URL(url).pathname)?.[1].toLowerCase() ?? '';
  return Object.hasOwn(URL_EXTS, ext) ? URL_EXTS[ext] : null;
}

/** 応答の本文を読む。上限を超えたら残りを受信せずに中止する */
async function readImage(res, label) {
  const tooLarge = () => new Error(`${label}が大きすぎます（上限 ${MAX_IMAGE_BYTES / 1024 / 1024} MiB）`);
  if (Number(res.headers.get('content-length')) > MAX_IMAGE_BYTES) {
    await res.body?.cancel();
    throw tooLarge();
  }
  const chunks = [];
  let size = 0;
  try {
    for await (const chunk of res.body ?? []) {
      size += chunk.byteLength;
      if (size > MAX_IMAGE_BYTES) break; // ループを抜けると受信も止まる
      chunks.push(chunk);
    }
  } catch (cause) {
    throw new Error(`${label}の受信が途中で失敗しました: ${cause.message}`, { cause });
  }
  if (size > MAX_IMAGE_BYTES) throw tooLarge();
  return Buffer.concat(chunks);
}

async function downloadImage(config, url, postNumber) {
  const { host, pathname } = new URL(url);
  // 署名付き URL の署名をログに残さないよう、クエリは表示しない
  const label = `記事 ${postNumber} の画像 https://${host}${pathname} `;
  let { res, finalUrl } = await requestImage(config, url, false, label);
  if (res.status === 401 || res.status === 403) {
    await res.body?.cancel();
    ({ res, finalUrl } = await requestImage(config, url, true, label));
  }
  if (!res.ok) throw new Error(`${label}を取得できません: HTTP ${res.status}`);
  const type = res.headers.get('content-type');
  // 転送後の URL に拡張子がなければ、本文に書かれた URL の拡張子を使う
  const ext = imageExtension(finalUrl, type) ?? imageExtension(url, type);
  if (!ext) {
    await res.body?.cancel();
    throw new Error(`${label}は対応していない形式です（Content-Type: ${type ?? 'なし'}）`);
  }
  return { ext, data: await readImage(res, label) };
}

/** 本文中の esa 画像を取得し、サイト内の画像に置き換えた本文を返す */
async function convertBody(config, post) {
  const body = String(post.body_md ?? '').replace(/\r\n?/g, '\n');
  const target = (groups) => esaImageUrl(
    groups.mdAngle ?? groups.mdBare ?? groups.imgDouble ?? groups.imgSingle ?? groups.imgBare ?? '',
  );

  const urls = new Set();
  for (const match of body.matchAll(IMAGE_PATTERN)) {
    const url = target(match.groups);
    if (url) urls.add(url);
  }

  const images = [];
  const names = new Map();
  for (const url of urls) {
    const { ext, data } = await downloadImage(config, url, post.number);
    const name = `esa-${post.number}-${images.length + 1}.${ext}`;
    images.push({ name, data });
    names.set(url, name);
  }

  const converted = body.replace(IMAGE_PATTERN, (whole, ...args) => {
    const groups = args.at(-1);
    const name = names.get(target(groups));
    if (!name) return whole;
    const path = `/images/news/esa/${name}`;
    return groups.mdHead ? `${groups.mdHead}${path}` : `${groups.imgHead}"${path}"`;
  });
  return { body: converted, images };
}

function jstDate(post) {
  const date = new Date(post.created_at ?? NaN);
  if (Number.isNaN(date.getTime())) throw new Error(`記事 ${post.number} の created_at が不正です`);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

function renderPost(post, body, category) {
  const sub = post.category.slice(category.length + 1).split('/')[0];
  const tags = [...new Set([...(post.tags ?? []), sub].filter(Boolean))];
  const revision = Number(post.revision_number ?? NaN);
  const lines = [
    '---',
    `title: ${JSON.stringify(post.name ?? '')}`,
    `date: ${jstDate(post)}`,
    `tags: ${JSON.stringify(tags)}`,
    'source: esa',
    `esa_id: ${post.number}`,
  ];
  if (Number.isFinite(revision)) lines.push(`revision: ${revision}`);
  if (post.created_by?.name) lines.push(`author: ${JSON.stringify(post.created_by.name)}`);
  lines.push('---', '');
  return `${lines.join('\n')}\n${body.trimEnd()}\n`;
}

async function listFiles(dir, pattern) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile() && pattern.test(e.name)).map((e) => e.name);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function syncEsa(options = {}) {
  const config = readConfig(options);
  const { category, outDir, imageDir } = config;

  // 1. 取得と変換（ここではファイルに触らない）
  const posts = (await fetchPosts(config)).filter((post) => isPublic(post, category));
  for (const post of posts) {
    if (!Number.isSafeInteger(post.number) || post.number <= 0) {
      throw new Error(`記事番号が不正です: ${JSON.stringify(post.number)}`);
    }
  }
  const oldPosts = await listFiles(outDir, POST_FILE);
  if (posts.length === 0 && oldPosts.length > 0 && !config.allowEmpty) {
    throw new Error(
      `公開対象の記事が0件ですが、取り込み済みの記事が ${oldPosts.length} 件あります。`
      + '誤って全記事を消さないよう中止しました。意図した全件取り消しなら ESA_ALLOW_EMPTY=true で実行してください',
    );
  }
  const newPosts = new Map();
  const newImages = new Map();
  for (const post of posts) {
    const { body, images } = await convertBody(config, post);
    newPosts.set(`esa-${post.number}.md`, renderPost(post, body, category));
    for (const { name, data } of images) newImages.set(name, data);
  }

  // 2. 書き込み
  await mkdir(outDir, { recursive: true });
  await mkdir(imageDir, { recursive: true });
  for (const [name, data] of newImages) await writeFile(join(imageDir, name), data);
  for (const [name, text] of newPosts) await writeFile(join(outDir, name), text, 'utf8');

  // 3. 公開対象から外れた記事と、使われなくなった画像を消す（esa-<番号> のファイルだけが対象）
  const removedPosts = oldPosts.filter((name) => !newPosts.has(name));
  const removedImages = (await listFiles(imageDir, IMAGE_FILE)).filter((name) => !newImages.has(name));
  for (const name of removedPosts) await rm(join(outDir, name));
  for (const name of removedImages) await rm(join(imageDir, name));

  config.log(
    `esa: 記事 ${newPosts.size} 件・画像 ${newImages.size} 件を同期、`
    + `記事 ${removedPosts.length} 件・画像 ${removedImages.length} 件を削除しました`,
  );
  return { posts: [...newPosts.keys()], images: [...newImages.keys()], removedPosts, removedImages };
}

async function main() {
  try {
    await syncEsa();
  } catch (error) {
    console.error(`esa 同期に失敗しました: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  await main();
}
