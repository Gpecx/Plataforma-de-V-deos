import { getAllCourses, getAllTeachers } from '@/app/actions/admin'
import AllCoursesClient from './components/AllCoursesClient'

export const dynamic = 'force-dynamic'

export default async function AllCoursesPage() {
    const courses = await getAllCourses()
    const teachers = await getAllTeachers()

    return <AllCoursesClient courses={courses} teachers={teachers} />
}
