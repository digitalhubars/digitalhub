import { useState } from 'react';
import { KeyRound, Monitor, Smartphone } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import Field from '../../../components/ui/Field';
import Modal from '../../../components/ui/Modal';
import Toggle from '../../../components/ui/Toggle';
import { useApp } from '../../../context/AppContext';
import { ui } from '../../../styles/ui';
import CopyField from '../CopyField';

export default function SecurityTab() {
  const { settings, updateSettings, sessions, setSessions, showToast, go, canEditPage } = useApp();
  const [setupOpen, setSetupOpen] = useState(false);
  const [code, setCode] = useState('');

  // Mock: a real setup verifies the code against the shared secret on a server.
  const verify = () => {
    updateSettings({ twoFactor: true }, 'Two-step verification is on');
    setSetupOpen(false);
    setCode('');
  };

  return (
    <div className="space-y-4">
      <Card title="Sign-in">
        <div className={`px-4 sm:px-5 ${ui.divide}`}>
          <Toggle
            label="Two-step verification"
            hint="Ask for a code from an authenticator app when signing in."
            checked={settings.twoFactor}
            disabled={!canEditPage('settings.security')}
            onChange={(on) => (on ? setSetupOpen(true) : updateSettings({ twoFactor: false }, 'Two-step verification turned off'))}
          />
          <div className="flex items-center justify-between gap-4 py-3">
            <span>
              <span className={`block text-sm font-medium ${ui.h}`}>Password</span>
              <span className={`block text-xs ${ui.muted}`}>Change it any time.</span>
            </span>
            <Button size="sm" disabled={!canEditPage('password')} onClick={() => go('password')}>
              <KeyRound size={12} /> Change
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title="Where you're signed in"
        action={
          sessions.length > 1 && canEditPage('settings.security') && (
            <button
              type="button"
              onClick={() => {
                setSessions((list) => list.filter((s) => s.current));
                showToast({ title: 'Signed out of other devices' });
              }}
              className="text-xs font-medium text-red-700 hover:underline dark:text-red-400"
            >
              Sign out everywhere else
            </button>
          )
        }
      >
        <ul className={ui.divide}>
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              {s.icon === 'mobile' ? <Smartphone size={18} className={ui.muted} /> : <Monitor size={18} className={ui.muted} />}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${ui.h}`}>{s.device}</p>
                <p className={`text-xs ${ui.muted}`}>
                  {s.place} · {s.last}
                </p>
              </div>
              {s.current ? (
                <Badge tone="success">This device</Badge>
              ) : (
                <Button
                  size="sm"
                  disabled={!canEditPage('settings.security')}
                  onClick={() => {
                    setSessions((list) => list.filter((x) => x.id !== s.id));
                    showToast({ title: `Signed out of ${s.device}` });
                  }}
                >
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {setupOpen && (
        <Modal
          title="Turn on two-step verification"
          size="sm"
          onClose={() => setSetupOpen(false)}
          footer={
            <>
              <Button onClick={() => setSetupOpen(false)}>Cancel</Button>
              <Button variant="primary" disabled={!/^\d{6}$/.test(code)} onClick={verify}>
                Verify
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <p className={ui.body}>Scan this key with your authenticator app, then enter the 6-digit code it shows.</p>
            <CopyField value="JBSW Y3DP EHPK 3PXP" />
            <Field label="6-digit code">
              <input
                inputMode="numeric"
                maxLength={6}
                className={`${ui.input} tracking-[0.4em]`}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
