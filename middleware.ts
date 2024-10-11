import { rewrite } from '@vercel/edge';

export default function middleware(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/ru") || url.pathname.startsWith("/en")) {
    return undefined;
  }

  const acceptLanguage = request.headers.get("Accept-Language");
  if (!acceptLanguage) return rewrite(new URL('/en' + url.pathname, url), { status: 302 });

  if (acceptLanguage.includes('ru-RU')) {
    return rewrite(new URL('/ru' + url.pathname, url), { status: 302 });
  }
 
  if (url.pathname.startsWith('/banana')) {
    return rewrite(new URL('https://google.com'));
  }

  return rewrite(new URL('/en' + url.pathname, url), { status: 302 });
}
