import { NextResponse } from "next/server";
import { reason, buildFactsheet, type AiAnswer } from "@/lib/ai/reasoner";

export const runtime = "nodejs";

/**
 * Ask CommandIQ — the AI CFO (§15).
 *
 * The deterministic reasoner is always authoritative: every number it returns
 * is computed from real financial state, so it cannot hallucinate. When an
 * ANTHROPIC_API_KEY is configured AND the question doesn't match a known
 * intent, we let Claude phrase a grounded answer — but strictly constrained to
 * the provided factsheet, and we fall back to the reasoner on any failure.
 */
export async function POST(req: Request) {
  let question = "";
  try {
    const body = await req.json();
    question = String(body.question ?? "").slice(0, 500);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!question.trim()) {
    return NextResponse.json({ error: "Empty question" }, { status: 400 });
  }

  const base = reason(question);

  // Only reach for the model when the deterministic path couldn't ground it.
  if (!base.grounded && process.env.ANTHROPIC_API_KEY) {
    const enhanced = await tryClaude(question).catch(() => null);
    if (enhanced) return NextResponse.json(enhanced);
  }

  return NextResponse.json(base);
}

async function tryClaude(question: string): Promise<AiAnswer | null> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const facts = buildFactsheet();

  const system = `You are CommandIQ, an AI CFO for a retail business. Answer ONLY using the FACTS provided. Never invent numbers. If the facts don't support an answer, say so. Respond as strict JSON with keys: conclusion (string), evidence (string[] of factual figures), impact (string), recommendation (string). Be concise and decisive.\n\nFACTS:\n${facts}`;

  const res = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 700,
    system,
    messages: [{ role: "user", content: question }],
  });

  const text = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const parsed = JSON.parse(match[0]) as Partial<AiAnswer>;
  if (!parsed.conclusion || !parsed.recommendation) return null;

  return {
    conclusion: parsed.conclusion,
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence.slice(0, 6).map(String) : [],
    impact: typeof parsed.impact === "string" ? parsed.impact : undefined,
    recommendation: parsed.recommendation,
    grounded: true,
    provider: "Claude · grounded",
  };
}
