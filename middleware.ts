import { rewrite } from '@vercel/edge';

function redirect(newUrl: string, baseUrl: URL) {
  const key = `?redirect_key=${Math.random().toString(16).slice(2)}`;
  const redirectUrl = new URL(newUrl + baseUrl.pathname + key, baseUrl);
  return rewrite(baseUrl, { status: 302, headers: { Location: redirectUrl.href } });
}

export default function middleware(request: Request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/ru") || url.pathname.startsWith("/en")) {
    return undefined;
  }

  const acceptLanguage = request.headers.get("Accept-Language");
  if (!acceptLanguage) return redirect('/en?1', url);

  if (acceptLanguage.includes('ru-RU')) {
    return redirect('/ru', url);
  }
 
  if (url.pathname.startsWith('/z')) {
    return rewrite(new URL('https://службапоконтракту.рф'));
  }

  return redirect('/en?2', url);
}
