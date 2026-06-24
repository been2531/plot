const UPLOAD_ENDPOINT = import.meta.env.VITE_R2_UPLOAD_ENDPOINT as string | undefined
const R2_BASE_URL = import.meta.env.VITE_R2_BASE_URL as string | undefined

export function isR2Configured(): boolean {
  return Boolean(UPLOAD_ENDPOINT)
}

/**
 * 이미지 파일을 Cloudflare R2에 업로드하고 퍼블릭 URL을 반환.
 * Worker 엔드포인트는 multipart/form-data로 파일을 받고
 * { key: string } 또는 { url: string }을 응답해야 함.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!UPLOAD_ENDPOINT) {
    throw new Error('R2 업로드 엔드포인트가 설정되지 않았습니다. VITE_R2_UPLOAD_ENDPOINT를 확인하세요.')
  }

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: formData })

  if (!res.ok) {
    throw new Error(`이미지 업로드 실패 (${res.status})`)
  }

  const data = (await res.json()) as { url?: string; key?: string }

  if (data.url) return data.url
  if (data.key && R2_BASE_URL) return `${R2_BASE_URL.replace(/\/$/, '')}/${data.key}`

  throw new Error('업로드 응답에서 이미지 URL을 확인할 수 없습니다.')
}

export function validateImageFile(file: File): string | null {
  const MAX_MB = 5
  if (!file.type.startsWith('image/')) return '이미지 파일만 업로드할 수 있습니다.'
  if (file.size > MAX_MB * 1024 * 1024) return `파일 크기는 ${MAX_MB}MB 이하여야 합니다.`
  return null
}
