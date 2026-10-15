import { Card } from '../../../components/ui/Card';
import Toggle from '../../../components/ui/Toggle';
import { useApp } from '../../../context/AppContext';
import { ui } from '../../../styles/ui';

export default function NotificationsTab() {
  const { settings, updateSettings, role } = useApp();
  const notify = settings.notify;
  const set = (key) => (on) => updateSettings({ notify: { ...notify, [key]: on } }, 'Notification preference saved');

  return (
    <Card title="Email me when…">
      <div className={`px-4 sm:px-5 ${ui.divide}`}>
        <Toggle label="A new order comes in" hint="One email per order." checked={notify.newOrder} onChange={set('newOrder')} />
        <Toggle
          label="A product runs low on stock"
          hint={`When stock drops below ${settings.lowStockThreshold}.`}
          checked={notify.lowStock}
          onChange={set('lowStock')}
        />
        {role !== 'client' && (
          <Toggle label="A store stops syncing" hint="Connection errors and failed updates." checked={notify.syncFailed} onChange={set('syncFailed')} />
        )}
        {role === 'admin' && (
          <Toggle label="A client changes something" hint="Product edits made by clients." checked={notify.clientActivity} onChange={set('clientActivity')} />
        )}
        <Toggle label="Weekly summary" hint="Sales and orders, every Monday morning." checked={notify.weeklySummary} onChange={set('weeklySummary')} />
      </div>
    </Card>
  );
}
