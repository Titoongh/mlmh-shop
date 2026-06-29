import Header from './Header'

// Header is a Client Component but is still server-rendered into the initial HTML so
// the nav/logo paint immediately (no blank black box on first load). Cart count and
// auth-dependent items hydrate on the client; their initial render matches the server
// (empty cart, auth not yet loaded) so there is no hydration mismatch.
export default function HeaderClient() {
    return <Header />
}
