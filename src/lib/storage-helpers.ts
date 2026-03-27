import { storage } from './firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export async function uploadCourseVideo(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `videos/${fileName}`

    const storageRef = ref(storage, filePath)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
}

export async function uploadCourseImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `images/${fileName}`

    const storageRef = ref(storage, filePath)
    await uploadBytes(storageRef, file)
    return await getDownloadURL(storageRef)
}
