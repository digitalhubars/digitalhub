import { Card } from '../../components/ui/Card';
import LinkButton from '../../components/ui/LinkButton';
import { useApp } from '../../context/AppContext';
import { timeAgo } from '../../lib/format';
import { ui } from '../../styles/ui';

export default function RecentActivityCard() {
  const { activity, go } = useApp();
  return (
    <Card title="Recent activity" action={<LinkButton onClick={() => go('settings', 'activity')}>View log</LinkButton>}>
      <ul className={ui.divide}>
        {activity.slice(0, 6).map((entry) => (
          <li key={entry.id} className="px-4 py-2.5 text-sm sm:px-5">
            <p className={ui.body}>{entry.text}</p>
            <p className={`mt-0.5 text-xs ${ui.muted}`}>
              {entry.actor} · {timeAgo(entry.at)}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
