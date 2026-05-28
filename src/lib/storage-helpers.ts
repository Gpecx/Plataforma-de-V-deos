import { storage } from './firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'


export async function uploadCourseImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `images/${fileName}`

    const storageRef = ref(storage, filePath)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
}

export async function uploadBannerImage(file: File, category: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
    const filePath = `branding/banners/${category}/${fileName}`

    const storageRef = ref(storage, filePath)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
}
