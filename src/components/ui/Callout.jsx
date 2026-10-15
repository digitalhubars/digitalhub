import { Lock } from 'lucide-react';
import { TONES } from '../../styles/ui';

export default function Callout({ icon: Icon = Lock, tone = 'neutral', children, action }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm ${TONES[tone]}`}>
      <Icon size={15} className="shrink-0" />
      <span className="flex-1">{children}</span>
      {action}
    </div>
  );
}
