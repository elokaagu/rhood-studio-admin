import { generateText } from "ai";

function refineErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    /oidc|unauthorized|401|gateway|api key|credentials/i.test(message)
  ) {
    return "AI Gateway is not configured. Run `vercel env pull` locally, or set AI_GATEWAY_API_KEY.";
  }
  return message || "Failed to refine text";
}

export async function refineTextWithAi(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  try {
    const result = await generateText({
      model: "openai/gpt-5.4",
      system: params.system,
      prompt: params.prompt,
      maxOutputTokens: params.maxTokens ?? 400,
    });

    const text = result.text?.trim();
    if (!text) {
      throw new Error("The AI provider returned an empty response.");
    }
    return text;
  } catch (error) {
    throw new Error(refineErrorMessage(error));
  }
}
