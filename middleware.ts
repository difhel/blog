import { rewrite } from '@vercel/edge';

export default function middleware(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/ru")) {
    return undefined;
  }
  console.log(JSON.stringify(request), JSON.stringify(request.headers));
  return undefined;
  const acceptLanguage = request.headers["Accept-Language"] as string;

  if (acceptLanguage.includes('ru-RU')) {
    return rewrite(new URL('/ru' + url.pathname, url));
  }
 
  if (url.pathname.startsWith('/banana')) {
    return rewrite(new URL('https://google.com'));
  }
}
