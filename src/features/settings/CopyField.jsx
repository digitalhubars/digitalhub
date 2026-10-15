import { useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { ui } from '../../styles/ui';

// Read-only value with copy, plus show/hide for secrets.
export default function CopyField({ value, mono = true, secret }) {
  const { showToast } = useApp();
  const [visible, setVisible] = useState(!secret);
  const copy = () => {
    navigator.clipboard?.writeText(value).catch(() => {});
    showToast({ title: 'Copied to clipboard' });
  };
  return (
    <div className="flex gap-2">
      <input readOnly value={visible ? value : '•'.repeat(Math.min(24, value.length))} className={`${ui.input} ${mono ? 'font-mono text-xs' : ''}`} />
      {secret && (
        <Button className="px-2.5" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide' : 'Show'}>
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </Button>
      )}
      <Button className="px-2.5" onClick={copy} aria-label="Copy">
        <Copy size={15} />
      </Button>
    </div>
  );
}
