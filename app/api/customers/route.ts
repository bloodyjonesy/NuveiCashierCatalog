import { NextRequest, NextResponse } from "next/server";
import { getAllCustomers, createCustomer } from "@/lib/store";

export async function GET() {
  const customers = getAllCustomers();
  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const label = typeof body.label === "string" ? body.label : "";
  const user_token_id =
    typeof body.user_token_id === "string" ? body.user_token_id : "";

  if (!label.trim() || !user_token_id.trim()) {
    return NextResponse.json(
      { error: "label and user_token_id are required" },
      { status: 400 }
    );
  }

  const customer = createCustomer({
    label: label.trim(),
    user_token_id: user_token_id.trim(),
  });
  return NextResponse.json(customer);
}
