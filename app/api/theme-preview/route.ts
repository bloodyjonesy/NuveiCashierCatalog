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

function makeAbsolute(html: string, baseHref: string): string {
  return html
    .replace(/(\shref=["'])\/(?!\/)/g, (_, pre) => `${pre}${baseHref}/`)
    .replace(/(\ssrc=["'])\/(?!\/)/g, (_, pre) => `${pre}${baseHref}/`)
    .replace(/(\saction=["'])\/(?!\/)/g, (_, pre) => `${pre}${baseHref}/`)
    .replace(/(\sposter=["'])\/(?!\/)/g, (_, pre) => `${pre}${baseHref}/`);
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
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'live-custom-css';
    document.head.appendChild(styleEl);
  }
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'custom-css' && typeof e.data.css === 'string') {
      styleEl.textContent = e.data.css;
    }
  });
})();
`;

async function fetchAndInject(url: string): Promise<NextResponse> {
  try {
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
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 }
      );
    }

    let html = await res.text();

    const finalUrl = res.url || url;
    const parsed = new URL(finalUrl);
    const origin = parsed.origin;

    html = makeAbsolute(html, origin);
    html = stripCspMeta(html);

    const baseTag = `<base href="${origin}/" target="_self" />`;
    const liveStyle = `<style id="live-custom-css"></style>`;
    const liveScript = `<script>${INJECTED_SCRIPT}</script>`;

    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${baseTag}${liveStyle}`);
    } else if (html.includes("<HEAD>")) {
      html = html.replace("<HEAD>", `<HEAD>${baseTag}${liveStyle}`);
    } else {
      html = `${baseTag}${liveStyle}` + html;
    }

    if (html.includes("</body>")) {
      html = html.replace("</body>", `${liveScript}</body>`);
    } else if (html.includes("</BODY>")) {
      html = html.replace("</BODY>", `${liveScript}</BODY>`);
    } else {
      html += liveScript;
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
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
