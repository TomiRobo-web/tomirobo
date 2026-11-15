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

export function formatDate(d: Date): string {
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Tokyo' });
}
