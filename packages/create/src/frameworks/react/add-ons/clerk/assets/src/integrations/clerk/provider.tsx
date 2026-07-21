import { ClerkProvider } from '@clerk/tanstack-react-start'

export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClerkProvider>{children}</ClerkProvider>
}
