import { Card } from '../../../components/ui/Card';
import Toggle from '../../../components/ui/Toggle';
import { useApp } from '../../../context/AppContext';
import { ui } from '../../../styles/ui';

export default function NotificationsTab() {
  const { settings, updateSettings, role, canEditPage } = useApp();
  const notify = settings.notify;
  const set = (key) => (on) => updateSettings({ notify: { ...notify, [key]: on } }, 'Notification preference saved');

  return (
    <Card title="Email me when…">
      <div className={`px-4 sm:px-5 ${ui.divide}`}>
        <Toggle disabled={!canEditPage('settings.notifications')} label="A new order comes in" hint="One email per order." checked={notify.newOrder} onChange={set('newOrder')} />
        <Toggle
          label="A product runs low on stock"
          hint={`When stock drops below ${settings.lowStockThreshold}.`}
          checked={notify.lowStock}
          disabled={!canEditPage('settings.notifications')}
          onChange={set('lowStock')}
        />
        {role !== 'staff' && (
          <Toggle disabled={!canEditPage('settings.notifications')} label="A store stops syncing" hint="Connection errors and failed updates." checked={notify.syncFailed} onChange={set('syncFailed')} />
        )}
        {role === 'admin' && (
          <Toggle disabled={!canEditPage('settings.notifications')} label="A client changes something" hint="Product edits made by staff." checked={notify.clientActivity} onChange={set('clientActivity')} />
        )}
        <Toggle disabled={!canEditPage('settings.notifications')} label="Weekly summary" hint="Sales and orders, every Monday morning." checked={notify.weeklySummary} onChange={set('weeklySummary')} />
      </div>
    </Card>
  );
}
