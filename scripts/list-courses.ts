import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

async function listCourses() {
    try {
        console.log('Fetching all courses...')
        const snap = await getDocs(collection(db, 'courses'))

        if (snap.empty) {
            console.log('No courses found.')
        } else {
            snap.forEach(doc => {
                console.log(`ID: ${doc.id} | Title: ${doc.data().title}`)
            })
        }
    } catch (error) {
        console.error('Error fetching courses:', error)
    } finally {
        process.exit(0)
    }
}

listCourses()
