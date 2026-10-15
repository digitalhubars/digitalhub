import { useState } from 'react';
import { Download } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import DataTable from '../../../components/ui/DataTable';
import Select from '../../../components/ui/Select';
import { useApp } from '../../../context/AppContext';
import { downloadCsv, formatDateTime, timeAgo } from '../../../lib/format';
import { ui } from '../../../styles/ui';

const TYPES = ['product', 'order', 'client', 'integration', 'team', 'settings'];

export default function ActivityTab() {
  const { activity } = useApp();
  const [type, setType] = useState('all');
  const rows = activity.filter((a) => type === 'all' || a.type === type);

  return (
    <Card
      title="Activity log"
      action={
        <div className="flex w-full gap-2 sm:w-auto">
          <Select
            value={type}
            onChange={setType}
            className="sm:w-40"
            options={[{ value: 'all', label: 'Everything' }, ...TYPES.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))]}
          />
          <Button
            className="px-2.5"
            aria-label="Export"
            onClick={() => downloadCsv('activity.csv', rows.map((a) => ({ when: new Date(a.at).toISOString(), who: a.actor, type: a.type, what: a.text })))}
          >
            <Download size={15} />
          </Button>
        </div>
      }
    >
      <DataTable
        rows={rows}
        pageSize={12}
        empty="Nothing logged yet."
        columns={[
          { key: 'text', label: 'What happened', primary: true, render: (a) => <span className={ui.body}>{a.text}</span> },
          { key: 'actor', label: 'Who' },
          { key: 'type', label: 'Type', render: (a) => <Badge tone="neutral">{a.type}</Badge> },
          { key: 'at', label: 'When', align: 'right', render: (a) => <span title={formatDateTime(a.at)}>{timeAgo(a.at)}</span> },
        ]}
      />
    </Card>
  );
}
