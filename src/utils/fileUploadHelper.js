/**
 * Web Crypto API 计算 SHA-256，返回 hex 字符串
 * 20MB 文件约 100ms
 */
export async function calculateSHA256(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 上传前 PDF 格式校验
 * MIME 类型 + 扩展名双重检查
 */
export function validatePdfFile(file) {
  if (file.type !== 'application/pdf' && !file.name.match(/\.pdf$/i)) {
    return { valid: false, reason: `${file.name}: 仅支持 PDF 格式，该文件无法导入` }
  }
  if (file.size > 20 * 1024 * 1024) {
    return { valid: false, reason: `${file.name}: 文件大小不能超过 20MB` }
  }
  return { valid: true }
}
