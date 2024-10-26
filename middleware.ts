import { rewrite } from '@vercel/edge';

function redirect(newUrl: string, baseUrl: URL) {
  // const key = `?redirect_key=${Math.random().toString(16).slice(2)}`;
  const key = '';
  const redirectUrl = new URL(newUrl + baseUrl.pathname + key, baseUrl);
  return rewrite(baseUrl, { status: 302, headers: { Location: redirectUrl.href } });
}

export default function middleware(request: Request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/ru") || url.pathname.startsWith("/en")) {
    return undefined;
  }

  if (url.pathname.startsWith("/get/")) {
    return rewrite(new URL("/en" + url.pathname, url), { status: 200 });
  }

  const acceptLanguage = request.headers.get("Accept-Language");
  if (!acceptLanguage) return redirect('/en', url);

  if (acceptLanguage.includes('ru-RU')) {
    return redirect('/ru', url);
  }

  return redirect('/en', url);
}
