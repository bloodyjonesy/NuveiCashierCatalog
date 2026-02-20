import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://ppp-test.safecharge.com",
  "https://secure.nuvei.com",
];

function isAllowedUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    return ALLOWED_ORIGINS.some((origin) => u.origin === origin);
  } catch {
    return false;
  }
}

function stripCspMeta(html: string): string {
  return html.replace(
    /<meta[^>]+http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/gi,
    ""
  );
}

function buildHeadInjection(nuveiOrigin: string): string {
  return `
<!-- == NUVEI CUSTOMIZER INJECTION START == -->
<base href="/api/nuvei-proxy/" target="_self" />
<style id="live-custom-css"></style>
<script>
(function() {
  console.log('[nuvei-customizer] Injected script running in <head>');

  // 1. CSS live-edit listener — runs immediately so postMessage works ASAP
  var styleEl = document.getElementById('live-custom-css');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'live-custom-css';
    (document.head || document.documentElement).appendChild(styleEl);
  }
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'custom-css' && typeof e.data.css === 'string') {
      styleEl.textContent = e.data.css;
      console.log('[nuvei-customizer] CSS updated, length=' + e.data.css.length);
    }
  });

  // 2. Intercept fetch() — route relative and Nuvei-absolute URLs through our proxy
  var NUVEI = '${nuveiOrigin}';
  var PROXY = '/api/nuvei-proxy';
  var _fetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string') {
      if (input.startsWith(NUVEI)) {
        input = PROXY + input.substring(NUVEI.length);
      } else if (input.startsWith('/') && !input.startsWith('/api/')) {
        input = PROXY + input;
      }
    } else if (input instanceof Request) {
      var u = input.url;
      var rewritten = null;
      if (u.startsWith(NUVEI)) {
        rewritten = PROXY + u.substring(NUVEI.length);
      }
      if (rewritten) {
        input = new Request(rewritten, input);
      }
    }
    return _fetch.call(this, input, init);
  };

  // 3. Intercept XMLHttpRequest.open — same rewriting
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    var url = arguments[1];
    if (typeof url === 'string') {
      if (url.startsWith(NUVEI)) {
        arguments[1] = PROXY + url.substring(NUVEI.length);
      } else if (url.startsWith('/') && !url.startsWith('/api/')) {
        arguments[1] = PROXY + url;
      }
    }
    return _open.apply(this, arguments);
  };

  console.log('[nuvei-customizer] fetch/XHR interceptors installed, proxying to', PROXY);
})();
</script>
<!-- == NUVEI CUSTOMIZER INJECTION END == -->
`;
}

async function fetchAndInject(url: string): Promise<NextResponse> {
  try {
    console.log("[theme-preview] Fetching:", url);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      console.error("[theme-preview] Upstream returned", res.status);
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 }
      );
    }

    let html = await res.text();

    const finalUrl = res.url || url;
    const parsed = new URL(finalUrl);
    const nuveiOrigin = parsed.origin;

    console.log("[theme-preview] Final URL after redirects:", finalUrl);
    console.log("[theme-preview] Nuvei origin:", nuveiOrigin);
    console.log("[theme-preview] HTML length:", html.length);

    html = stripCspMeta(html);

    const injection = buildHeadInjection(nuveiOrigin);

    if (html.includes("<head>")) {
      html = html.replace("<head>", "<head>" + injection);
    } else if (html.includes("<HEAD>")) {
      html = html.replace("<HEAD>", "<HEAD>" + injection);
    } else if (html.includes("<html")) {
      html = html.replace(/<html[^>]*>/, (match) => match + "<head>" + injection + "</head>");
    } else {
      html = "<head>" + injection + "</head>" + html;
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (e) {
    console.error("[theme-preview] fetch error:", e);
    return NextResponse.json(
      { error: "Failed to fetch hosted page" },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim() ?? "";

  if (!url || !isAllowedUrl(url)) {
    return NextResponse.json(
      { error: "Missing or disallowed url" },
      { status: 400 }
    );
  }

  return fetchAndInject(url);
}

export async function POST(request: NextRequest) {
  let url: string;
  try {
    const body = await request.json();
    url = typeof body.url === "string" ? body.url.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!url || !isAllowedUrl(url)) {
    return NextResponse.json(
      { error: "Missing or disallowed url (only Nuvei hosted pages allowed)" },
      { status: 400 }
    );
  }

  return fetchAndInject(url);
}
