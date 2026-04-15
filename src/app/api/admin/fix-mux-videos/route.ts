import { NextResponse } from 'next/server'
import { getMuxClient } from '@/lib/mux'
import { getSessionUser } from '@/app/actions/auth'

interface FixRequest {
    courseTitle?: string
    assetId?: string
    playbackId?: string
}

export async function POST(request: Request) {
    try {
        const user = await getSessionUser()
        
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { adminDb } = await import('@/lib/firebase-admin')
        const mux = getMuxClient()

        let body: FixRequest = {}
        try {
            body = await request.json()
        } catch {}

        const { assetId: providedAssetId, playbackId: providedPlaybackId, courseTitle } = body

        const coursesToFix = courseTitle ? [courseTitle] : ['UTS 500', 'GIGA UTD 100']
        const results = []

        for (const title of coursesToFix) {
            let courseDoc: any = null
            let currentPlaybackId: string | undefined

            if (providedPlaybackId) {
                currentPlaybackId = providedPlaybackId
            } else if (providedAssetId) {
                try {
                    const asset = await mux.video.assets.retrieve(providedAssetId)
                    const publicPolicy = asset.playback_ids?.find((p: any) => p.policy === 'public')
                    if (publicPolicy) {
                        results.push({
                            course: title,
                            status: 'already_public',
                            playbackId: publicPolicy.id
                        })
                        continue
                    }

                    await mux.video.assets.createPlaybackId(providedAssetId, {
                        policy: 'public'
                    })
                    const updatedAsset = await mux.video.assets.retrieve(providedAssetId)

                    const newPublicPbId = updatedAsset.playback_ids?.find((p: any) => p.policy === 'public')?.id

                    results.push({
                        course: title,
                        status: 'updated',
                        oldAssetId: providedAssetId,
                        newPlaybackId: newPublicPbId
                    })
                    continue
                } catch (e: any) {
                    results.push({ course: title, status: 'error', error: e.message })
                    continue
                }
            } else {
                const coursesSnapshot = await adminDb.collection('courses')
                    .where('title', '==', title)
                    .limit(1)
                    .get()

                if (coursesSnapshot.empty) {
                    results.push({ course: title, status: 'not_found' })
                    continue
                }

                courseDoc = coursesSnapshot.docs[0]
                const courseData = courseDoc.data()
                currentPlaybackId = courseData.intro_video_playback_id

                if (!currentPlaybackId) {
                    results.push({ course: title, status: 'no_playback_id' })
                    continue
                }
            }

            if (!currentPlaybackId) {
                results.push({ course: title, status: 'no_playback_id' })
                continue
            }

            const assetIdToUse = providedAssetId || currentPlaybackId.split('_')[0]

            try {
                const asset = await mux.video.assets.retrieve(assetIdToUse)
                const existingPublicPolicy = asset.playback_ids?.find(
                    (p: any) => p.policy === 'public'
                )

                if (existingPublicPolicy) {
                    results.push({ 
                        course: title, 
                        status: 'already_public',
                        playbackId: existingPublicPolicy.id 
                    })
                    if (courseDoc) {
                        await adminDb.collection('courses').doc(courseDoc.id).update({
                            intro_video_playback_id: existingPublicPolicy.id,
                            updated_at: new Date()
                        })
                    }
                    continue
                }

                await mux.video.assets.createPlaybackId(assetIdToUse, {
                    policy: 'public'
                })
                const updatedAsset = await mux.video.assets.retrieve(assetIdToUse)

                const newPublicPlaybackId = updatedAsset.playback_ids?.find(
                    (p: any) => p.policy === 'public'
                )?.id

                if (courseDoc && newPublicPlaybackId) {
                    await adminDb.collection('courses').doc(courseDoc.id).update({
                        intro_video_playback_id: newPublicPlaybackId,
                        updated_at: new Date()
                    })
                }

                results.push({ 
                    course: title, 
                    status: 'updated',
                    assetId: assetIdToUse,
                    newPlaybackId: newPublicPlaybackId || currentPlaybackId
                })

            } catch (assetError: any) {
                results.push({ 
                    course: title, 
                    status: 'error',
                    error: assetError.message 
                })
            }
        }

        return NextResponse.json({ success: true, results })
    } catch (error: any) {
        console.error('Fix Mux Videos Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ 
        message: 'Use POST para executar a migração dos vídeos intro para política pública.',
        courses: ['UTS 500', 'GIGA UTD 100']
    })
}