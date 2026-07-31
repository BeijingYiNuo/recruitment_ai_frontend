/**
 * AI 面试官语音播放：Web Audio 流式播放 24kHz PCM。
 * 与麦克风采集（16kHz）完全独立。队列为空时输出静音，天然抗抖动、可打断。
 */

const SAMPLE_RATE = 24000
const BUFFER_SIZE = 2048 // ScriptProcessor 缓冲（约 85ms @ 24kHz）

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function useRealtimeAudioPlayer() {
  let ctx: AudioContext | null = null
  let processor: ScriptProcessorNode | null = null
  let queue: Float32Array[] = []
  let queueOffset = 0
  let running = false

  async function start(): Promise<void> {
    if (ctx || running) return
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    ctx = new Ctx({ sampleRate: SAMPLE_RATE })
    processor = ctx.createScriptProcessor(BUFFER_SIZE, 0, 1)
    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      const out = e.outputBuffer.getChannelData(0)
      let written = 0
      while (written < out.length && queue.length > 0) {
        const cur = queue[0]
        const n = Math.min(out.length - written, cur.length - queueOffset)
        for (let i = 0; i < n; i++) {
          out[written + i] = cur[queueOffset + i]
        }
        queueOffset += n
        written += n
        if (queueOffset >= cur.length) {
          queue.shift()
          queueOffset = 0
        }
      }
      // 队列不足时补静音
      for (let i = written; i < out.length; i++) out[i] = 0
    }
    processor.connect(ctx.destination)
    running = true
    // 用户已点击过“开始 AI 面试”，自动播放策略应已放行
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        /* ignore */
      }
    }
  }

  function pushChunk(base64: string): void {
    if (!ctx || !running) return
    const bytes = base64ToBytes(base64)
    const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2)
    const f = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) f[i] = int16[i] / 32768
    queue.push(f)
  }

  // 候选人开口时立即静音：清空待播队列，正在输出的缓冲自然滑向静音
  function interrupt(): void {
    queue = []
    queueOffset = 0
  }

  async function pause(): Promise<void> {
    if (ctx && ctx.state === 'running') {
      try {
        await ctx.suspend()
      } catch {
        /* ignore */
      }
    }
  }

  async function resume(): Promise<void> {
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        /* ignore */
      }
    }
  }

  async function stop(): Promise<void> {
    running = false
    queue = []
    queueOffset = 0
    if (processor) {
      try {
        processor.disconnect()
      } catch {
        /* ignore */
      }
      processor = null
    }
    if (ctx && ctx.state !== 'closed') {
      try {
        await ctx.close()
      } catch {
        /* ignore */
      }
    }
    ctx = null
  }

  return { start, pushChunk, interrupt, pause, resume, stop }
}
