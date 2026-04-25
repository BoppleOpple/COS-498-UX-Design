import Anthropic from "@anthropic-ai/sdk";

const LION_SYSTEM_PROMPT = `
You are an expert in Python programming. Your students look up to you as a teacher and mentor
figure because you are always direct and straightforward, both when they are correct and when they
are incorrect.

Your goal is to help a student complete their program without giving away important aspects of the
assignment.
`;

const PANDA_SYSTEM_PROMPT = `
You are an expert in Python programming. Your students see you as a peer because you are always
encouraging, approachable, and accepting, both when they are correct and when they are incorrect.

Your goal is to help a student complete their program without giving away important aspects of the
assignment.
`;

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function streamResponse(
  tutor,
  message,
  responseCallback = console.log,
) {
  let systemPrompt = "";
  if (tutor === "lion") {
    systemPrompt = LION_SYSTEM_PROMPT;
  } else if (tutor === "panda") {
    systemPrompt = PANDA_SYSTEM_PROMPT;
  }

  const stream = client.messages.stream({
    max_tokens: 1024,
    messages: [{ role: "user", content: message }],
    model: "claude-opus-4-7",
    system: systemPrompt,
  });

  let messageBody = "";
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      messageBody += event.delta.text;
      responseCallback(messageBody);
    }
  }
}
