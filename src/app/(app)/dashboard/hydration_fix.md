# Fix Hydration Mismatch in Dashboard

The dashboard is experiencing hydration mismatches due to:
1.  **Browser extensions**: Brave (and others) injecting attributes like `bis_skin_checked`.
2.  **Date/Time differences**: Server vs Client timezone/clock differences affecting greetings and tips.

## Proposed Changes

### Dashboard Server Components
- Add `suppressHydrationWarning` to all elements displaying dates or time-dependent text.
- Pass stable versions of dynamic data where possible.

### Dashboard Client Components
- Add `suppressHydrationWarning` to the main layout containers to tolerate browser-injected attributes.
- Use a `useEffect` for very dynamic data (like precise timestamps) if needed, though suppression is usually enough for simple UI text.

## Verification Plan
1.  **Manual Verification**: Open the dashboard in Brave and Chrome/Edge.
2.  **Console Check**: Ensure no "Hydration Mismatch" errors appear in the console.
