// サイト全体のメニュー。ページを増減するときはここだけ直す。
export const NAV = [
  { href: '/', en: 'HOME', ja: 'トップ' },
  { href: '/about/', en: 'ABOUT', ja: 'TomiRoboとは' },
  { href: '/news/', en: 'NEWS', ja: '活動報告' },
  { href: '/join/', en: 'JOIN', ja: 'メンバー募集' },
  { href: '/sponsor/', en: 'SPONSOR', ja: '協賛について' },
  { href: '/contact/', en: 'CONTACT', ja: 'お問い合わせ' },
] as const;
