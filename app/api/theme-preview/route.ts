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

function rewriteRelativeUrls(html: string, origin: string): string {
  return html
    .replace(/\shref="\/([^"]*)"/g, (_, path) => ` href="${origin}/${path}"`)
    .replace(/\ssrc="\/([^"]*)"/g, (_, path) => ` src="${origin}/${path}"`)
    .replace(/\saction="\/([^"]*)"/g, (_, path) => ` action="${origin}/${path}"`);
}

function stripCspMeta(html: string): string {
  return html.replace(
    /<meta[^>]+http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/gi,
    ""
  );
}

const INJECTED_SCRIPT = `
(function() {
  var styleEl = document.getElementById('live-custom-css');
  if (!styleEl) return;
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'custom-css' && typeof e.data.css === 'string') {
      styleEl.textContent = e.data.css;
    }
  });
})();
`;

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

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "NuveiCashierCatalog/1.0" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 }
      );
    }
    let html = await res.text();
    const parsed = new URL(url);
    const origin = parsed.origin;
    const basePath = parsed.pathname.replace(/\/[^/]*$/, "/");
    const baseHref = origin + basePath;

    html = rewriteRelativeUrls(html, origin);
    html = stripCspMeta(html);

    const baseTag = `<base href="${baseHref}" />`;
    const inject = `${baseTag}<style id="live-custom-css"></style><script>${INJECTED_SCRIPT}<\\/script>`;
    if (html.includes("<head>")) {
      html = html.replace("<head>", "<head>" + inject);
    } else if (html.includes("</head>")) {
      html = html.replace("</head>", inject + "</head>");
    } else {
      html = inject + html;
    }

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    console.error("[theme-preview] fetch error:", e);
    return NextResponse.json(
      { error: "Failed to fetch hosted page" },
      { status: 502 }
    );
  }
}
