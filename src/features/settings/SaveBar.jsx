import Button from '../../components/ui/Button';
import { ui } from '../../styles/ui';

// Card footer with a single save button, disabled until something changed.
export default function SaveBar({ onSave, dirty = true, label = 'Save changes' }) {
  return (
    <div className={`flex justify-end border-t px-4 py-3 sm:px-5 ${ui.line}`}>
      <Button variant="primary" onClick={onSave} disabled={!dirty}>
        {label}
      </Button>
    </div>
  );
}
