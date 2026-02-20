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

/**
 * Rewrite root-absolute URLs in HTML attributes so they go through our proxy.
 * e.g. href="/ppp/css/style.css" → href="/api/nuvei-proxy/ppp/css/style.css"
 */
function rewriteAbsoluteUrls(html: string): string {
  return html
    .replace(/(\shref=["'])\/(?!\/|api\/)/g, (_, pre) => `${pre}/api/nuvei-proxy/`)
    .replace(/(\ssrc=["'])\/(?!\/|api\/)/g, (_, pre) => `${pre}/api/nuvei-proxy/`)
    .replace(/(\saction=["'])\/(?!\/|api\/)/g, (_, pre) => `${pre}/api/nuvei-proxy/`);
}

function buildHeadInjection(nuveiOrigin: string, basePath: string): string {
  const proxyBase = `/api/nuvei-proxy${basePath}`;
  return `
<!-- == NUVEI CUSTOMIZER INJECTION START == -->
<base href="${proxyBase}" target="_self" />
<style id="live-custom-css"></style>
<script>
(function() {
  console.log('[nuvei-customizer] Injected script running in <head>');
  console.log('[nuvei-customizer] base href =', document.querySelector('base')?.href);

  // 1. CSS live-edit listener
  var styleEl = document.getElementById('live-custom-css');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'live-custom-css';
    (document.head || document.documentElement).appendChild(styleEl);
  }

  // Move style element to end of body once DOM is ready (cascade wins)
  function moveStyleToEnd() {
    var target = document.body || document.documentElement;
    if (styleEl.parentNode !== target || styleEl.nextSibling) {
      target.appendChild(styleEl);
      console.log('[nuvei-customizer] Moved style element to end of', target.tagName);
    }
  }
  if (document.body) {
    moveStyleToEnd();
  }
  document.addEventListener('DOMContentLoaded', moveStyleToEnd);
  // Also re-append after a delay in case Nuvei JS adds more stylesheets
  setTimeout(moveStyleToEnd, 1000);
  setTimeout(moveStyleToEnd, 3000);

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'custom-css' && typeof e.data.css === 'string') {
      moveStyleToEnd();
      styleEl.textContent = e.data.css;
      var hasImportant = e.data.css.indexOf('!important') !== -1;
      console.log('[nuvei-customizer] CSS updated, length=' + e.data.css.length + ', has !important=' + hasImportant);
      console.log('[nuvei-customizer] Style element in DOM:', !!styleEl.parentNode, 'parent:', styleEl.parentNode?.tagName);
      console.log('[nuvei-customizer] First 200 chars:', e.data.css.substring(0, 200));
    }
  });

  // 2. Intercept fetch() — route Nuvei-absolute and root-absolute URLs through proxy
  var NUVEI = '${nuveiOrigin}';
  var PROXY = '/api/nuvei-proxy';
  var _fetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string') {
      if (input.startsWith(NUVEI)) {
        input = PROXY + input.substring(NUVEI.length);
        console.log('[nuvei-customizer] fetch rewrite (abs):', input);
      } else if (input.startsWith('/') && !input.startsWith('/api/')) {
        input = PROXY + input;
        console.log('[nuvei-customizer] fetch rewrite (root):', input);
      }
    } else if (input instanceof Request) {
      var u = input.url;
      if (u.startsWith(NUVEI)) {
        input = new Request(PROXY + u.substring(NUVEI.length), input);
      }
    }
    return _fetch.call(this, input, init);
  };

  // 3. Intercept XMLHttpRequest.open
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    var url = arguments[1];
    if (typeof url === 'string') {
      if (url.startsWith(NUVEI)) {
        arguments[1] = PROXY + url.substring(NUVEI.length);
        console.log('[nuvei-customizer] XHR rewrite (abs):', arguments[1]);
      } else if (url.startsWith('/') && !url.startsWith('/api/')) {
        arguments[1] = PROXY + url;
        console.log('[nuvei-customizer] XHR rewrite (root):', arguments[1]);
      }
    }
    return _open.apply(this, arguments);
  };

  // 4. Intercept jQuery $.ajax if loaded later
  var _jqHook = false;
  function hookJquery() {
    if (_jqHook || !window.jQuery) return;
    _jqHook = true;
    jQuery.ajaxPrefilter(function(options) {
      if (options.url) {
        if (options.url.startsWith(NUVEI)) {
          options.url = PROXY + options.url.substring(NUVEI.length);
        } else if (options.url.startsWith('/') && !options.url.startsWith('/api/')) {
          options.url = PROXY + options.url;
        } else if (!options.url.startsWith('http') && !options.url.startsWith('/')) {
          // relative URL — jQuery resolves relative to page, but <base> should handle it
          // nothing to do
        }
        console.log('[nuvei-customizer] jQuery ajax url:', options.url);
      }
    });
    console.log('[nuvei-customizer] jQuery ajaxPrefilter installed');
  }
  // Try immediately + on DOM ready + poll briefly
  hookJquery();
  document.addEventListener('DOMContentLoaded', hookJquery);
  var jqPoll = setInterval(function() { hookJquery(); if (_jqHook) clearInterval(jqPoll); }, 50);
  setTimeout(function() { clearInterval(jqPoll); }, 5000);

  console.log('[nuvei-customizer] Interceptors installed, NUVEI=' + NUVEI + ', PROXY=' + PROXY);
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
    const basePath = parsed.pathname.replace(/\/[^/]*$/, "/");

    console.log("[theme-preview] Final URL after redirects:", finalUrl);
    console.log("[theme-preview] Nuvei origin:", nuveiOrigin);
    console.log("[theme-preview] Base path:", basePath);
    console.log("[theme-preview] HTML length:", html.length);

    html = stripCspMeta(html);
    html = rewriteAbsoluteUrls(html);

    const injection = buildHeadInjection(nuveiOrigin, basePath);

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
