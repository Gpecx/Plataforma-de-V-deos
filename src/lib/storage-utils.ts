import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadCourseImage(file: File): Promise<string> {
    const storageRef = ref(storage, `courses/images/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}

export async function uploadCourseVideo(file: File): Promise<string> {
    const storageRef = ref(storage, `courses/videos/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}
