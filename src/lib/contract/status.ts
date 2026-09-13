export type AmendmentStage =
  | "PENDING_REVIEW"
  | "OBJECTION_WINDOW"
  | "OBJECTED"
  | "INSTALL_PENDING"
  | "INSTALLED"
  | "DENIED"
  | "INCONCLUSIVE"
  | "UNGROUNDED"
  | "WITHDRAWN";

export type Tone = "green" | "amber" | "red";

const STAGE_TONE: Record<string, Tone> = {
  INSTALLED: "green",
  OBJECTION_WINDOW: "green",
  INSTALL_PENDING: "green",
  PENDING_REVIEW: "amber",
  OBJECTED: "amber",
  DENIED: "red",
  INCONCLUSIVE: "red",
  UNGROUNDED: "red",
  WITHDRAWN: "red",
};

export function statusTone(stage: string): Tone {
  return STAGE_TONE[stage] ?? "amber";
}
