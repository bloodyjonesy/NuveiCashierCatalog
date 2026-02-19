import { TestLinkClient } from "@/components/test-link-client";

export default function TestPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Test payment link</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Uses demo credentials from env (NUVEI_MERCHANT_ID, NUVEI_MERCHANT_SITE_ID, NUVEI_SECRET_KEY).
        Checks for trimming/newlines. Open the link to confirm &quot;invalid merchant id&quot; is resolved.
      </p>
      <TestLinkClient />
    </div>
  );
}
