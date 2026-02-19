/**
 * Server-side pre-deposit DMN response config. Set via Credentials UI and POST /api/pre-deposit-config.
 */
export type PreDepositMode = "always_accept" | "decline_with_message" | "decline_without_message";

let config: { mode: PreDepositMode; declineMessage: string } = {
  mode: "always_accept",
  declineMessage: "Your attempt has been declined.",
};

export function getPreDepositConfig(): { mode: PreDepositMode; declineMessage: string } {
  return { ...config };
}

export function setPreDepositConfig(updates: {
  mode?: PreDepositMode;
  declineMessage?: string;
}): void {
  if (updates.mode !== undefined) config.mode = updates.mode;
  if (updates.declineMessage !== undefined) config.declineMessage = updates.declineMessage;
}
