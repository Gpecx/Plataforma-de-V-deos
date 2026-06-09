import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// SEC: Allowed file types and size limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export async function uploadCourseImage(file: File): Promise<string> {
    // SEC: Validate file type and size
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido')
    }
    if (file.size > MAX_SIZE_BYTES) {
        throw new Error(`Arquivo maior que ${MAX_SIZE_MB}MB`)
    }
    const storageRef = ref(storage, `courses/images/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}

