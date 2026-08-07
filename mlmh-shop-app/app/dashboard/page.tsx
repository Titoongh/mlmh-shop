import { redirect } from 'next/navigation'

// L'ancien dashboard mono-page a été remplacé par la section /admin.
export default function DashboardRedirect() {
    redirect('/admin')
}
