import AdminDashboard from '@/components/AdminDashboard'
import AdminLogin from '@/components/AdminLogin'
import { isAdminAuthed } from '@/lib/admin-auth'

// Cookies are read on the server for every request — no static prerender.
export const instant = false

export default async function AdminPage() {
  const authed = await isAdminAuthed()
  return authed ? <AdminDashboard /> : <AdminLogin />
}
