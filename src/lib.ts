import { getCollection, type CollectionEntry } from 'astro:content';

export type News = CollectionEntry<'news'>;

/** 公開する NEWS 記事を新しい順で返す（draft: true は除く） */
export async function getPublishedNews(): Promise<News[]> {
  const all = await getCollection('news', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** 記事に使われているタグの一覧（重複なし・五十音順） */
export function collectTags(posts: News[]): string[] {
  return [...new Set(posts.flatMap((p) => p.data.tags))].sort((a, b) => a.localeCompare(b, 'ja'));
}

/** 記事の年度（4月始まり）。team_year があればそれを使う */
export function fiscalYear(post: News): number {
  if (post.data.team_year) return post.data.team_year;
  const d = post.data.date;
  const y = Number(d.toLocaleDateString('en-US', { year: 'numeric', timeZone: 'Asia/Tokyo' }));
  const m = Number(d.toLocaleDateString('en-US', { month: 'numeric', timeZone: 'Asia/Tokyo' }));
  return m >= 4 ? y : y - 1;
}

/** 年度ごとにまとめる（新しい年度が先） */
export function groupByFiscalYear(posts: News[]): [number, News[]][] {
  const map = new Map<number, News[]>();
  for (const p of posts) {
    const fy = fiscalYear(p);
    map.set(fy, [...(map.get(fy) ?? []), p]);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Tokyo' }).replaceAll('/', '.');
}

/** 一覧・記事ページで表示する日付。推定日付は「日付不明」とする */
export function displayDate(post: News): string {
  return post.data.date_estimated ? '日付不明' : formatDate(post.data.date);
}
