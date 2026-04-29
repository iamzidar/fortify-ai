import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config'
import { fortifyTools } from '../tools'
import { dispatchTool } from './tool-router'
import { buildSystemPrompt } from './system-prompt'

const client = new Anthropic({ apiKey: config.anthropicApiKey })

export type StreamCallback = (event: {
  type: 'text_delta' | 'tool_call' | 'tool_result' | 'done' | 'error'
  data: string
}) => void

interface Message {
  role: 'user' | 'assistant'
  content: string | Anthropic.ContentBlock[]
}

export async function runChatStream(
  userMessage: string,
  history: Message[],
  sessionName: string,
  sscUrl: string,
  username: string,
  onEvent: StreamCallback,
): Promise<Message[]> {
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content as string,
    })),
    { role: 'user', content: userMessage },
  ]

  const updatedHistory: Message[] = [...history, { role: 'user', content: userMessage }]

  // Agentic loop: keep running until Claude stops using tools
  while (true) {
    const stream = await client.messages.stream({
      model: config.anthropicModel,
      max_tokens: 4096,
      system: buildSystemPrompt(sscUrl, username),
      tools: fortifyTools,
      messages,
    })

    let assistantText = ''
    const assistantBlocks: Anthropic.ContentBlock[] = []

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        if (chunk.delta.type === 'text_delta') {
          assistantText += chunk.delta.text
          onEvent({ type: 'text_delta', data: chunk.delta.text })
        }
      }
    }

    const response = await stream.finalMessage()

    // Collect all content blocks from the response
    for (const block of response.content) {
      assistantBlocks.push(block)
    }

    // If Claude wants to use tools, execute them and continue the loop
    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content })

      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        onEvent({
          type: 'tool_call',
          data: JSON.stringify({ toolName: block.name, input: block.input }),
        })

        let result: unknown
        try {
          result = await dispatchTool(block.name, block.input as Parameters<typeof dispatchTool>[1], sessionName)
        } catch (err) {
          result = { error: (err as Error).message }
        }

        onEvent({
          type: 'tool_result',
          data: JSON.stringify({ toolName: block.name, result }),
        })

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        })
      }

      messages.push({ role: 'user', content: toolResults })
      continue
    }

    // Claude is done — emit done event and return updated history
    const finalText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    updatedHistory.push({ role: 'assistant', content: finalText || assistantText })
    onEvent({ type: 'done', data: '' })
    return updatedHistory
  }
}
