import { AuthKitProvider } from '@workos/authkit-tanstack-react-start/client'

export default function AppWorkOSProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthKitProvider>{children}</AuthKitProvider>
}
