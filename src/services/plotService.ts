import {
  collection,
  addDoc,
  setDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { Pin } from '@/shared/types'

export interface CreatePlotInput {
  title: string
  description?: string
  authorId: string
  authorName: string
  pins: Pin[]
  tags: string[]
  coverImageUrl?: string
  isPublic: boolean
  /** T16: 크리에이터 외부 후원 링크 */
  creatorSupportUrl?: string
}

/** plots 컬렉션에 새 플롯을 생성하고 doc ID를 반환 */
export async function createPlot(input: CreatePlotInput): Promise<string> {
  const ref = await addDoc(collection(db, 'plots'), {
    title: input.title,
    description: input.description ?? '',
    authorId: input.authorId,
    authorName: input.authorName,
    pinIds: input.pins.map((p) => p.id),
    tags: input.tags,
    coverImageUrl: input.coverImageUrl ?? null,
    creatorSupportUrl: input.creatorSupportUrl ?? null,
    isPublic: input.isPublic,
    scrapCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // pins 서브컬렉션 + 최상위 pins 컬렉션에 동시 기록
  // 최상위 pins/{pinId}는 useMapPins의 뷰포트 지오 쿼리용 (lat/lng 범위 필터)
  await Promise.all(
    input.pins.flatMap((pin) => [
      setDoc(doc(db, 'plots', ref.id, 'pins', pin.id), { ...pin, plotId: ref.id }),
      setDoc(doc(db, 'pins', pin.id), { ...pin, plotId: ref.id, isPublic: input.isPublic }),
    ]),
  )

  return ref.id
}

/** 플롯 핀 순서(pinIds) 업데이트 */
export async function updatePlotPinOrder(plotId: string, pinIds: string[]): Promise<void> {
  await updateDoc(doc(db, 'plots', plotId), {
    pinIds,
    updatedAt: serverTimestamp(),
  })
}
