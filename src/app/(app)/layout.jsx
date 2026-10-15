import ClientApp from '../../features/app/ClientApp';

// Every signed-in page. The app shell lives here so it keeps its state
// while you move between pages and (for admins) between dashboards.
export default function SignedInLayout({ children }) {
  return <ClientApp>{children}</ClientApp>;
}
