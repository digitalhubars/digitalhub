import { TriangleAlert } from 'lucide-react';
import Callout from '../../components/ui/Callout';
import { ui } from '../../styles/ui';

const Code = ({ children }) => <span className="font-mono text-xs">{children}</span>;

// Shown until .env.local / .env.production has the PocketBase URL.
export default function SetupNotice() {
  return (
    <div className="space-y-3 text-sm">
      <Callout icon={TriangleAlert} tone="warning">
        The PocketBase server is not configured yet.
      </Callout>
      <p className={ui.body}>
        Add <Code>NEXT_PUBLIC_POCKETBASE_URL</Code> to <Code>.env.local</Code>, then restart the server and start PocketBase on port 8090.
      </p>
    </div>
  );
}
