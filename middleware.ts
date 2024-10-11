import { rewrite } from '@vercel/edge';

export default function middleware(request: Request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/ru/en") || url.pathname.startsWith("/en/ru")) {
    // When user switch their language
    url.pathname.replace("/ru/en", "");
    url.pathname.replace("/en/ru", "");
  }
  if (url.pathname.startsWith("/ru") || url.pathname.startsWith("/en")) {
    return undefined;
  }

  const acceptLanguage = request.headers.get("Accept-Language");
  if (!acceptLanguage) return rewrite(new URL('/en' + url.pathname, url), { status: 302 });

  if (acceptLanguage.includes('ru-RU')) {
    return rewrite(new URL('/ru' + url.pathname, url), { status: 302 });
  }
 
  if (url.pathname.startsWith('/z')) {
    return rewrite(new URL('https://службапоконтракту.рф'));
  }

  return rewrite(new URL('/en' + url.pathname, url), { status: 302 });
}
