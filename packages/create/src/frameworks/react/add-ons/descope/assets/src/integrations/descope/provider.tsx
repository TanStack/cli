import { AuthProvider } from '@descope/react-sdk'

const PROJECT_ID = import.meta.env.VITE_DESCOPE_PROJECT_ID
if (!PROJECT_ID) {
  throw new Error('Add your Descope Project ID to the .env.local file')
}

export default function AppDescopeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider projectId={PROJECT_ID}>{children}</AuthProvider>
}
