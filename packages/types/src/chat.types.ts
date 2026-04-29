export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
  timestamp: string
}

export interface ChatRequest {
  message: string
  conversationId?: string
}

export type SSEEventType = 'text_delta' | 'tool_call' | 'tool_result' | 'done' | 'error'

export interface SSEEvent {
  type: SSEEventType
  data: string
}

export interface ToolCallEvent {
  toolName: string
  input: Record<string, unknown>
}

export interface ToolResultEvent {
  toolName: string
  result: unknown
}
