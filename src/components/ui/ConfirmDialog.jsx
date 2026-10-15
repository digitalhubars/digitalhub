import { ui } from '../../styles/ui';
import Button from './Button';
import Modal from './Modal';

export default function ConfirmDialog({ title, body, confirmLabel = 'Delete', tone = 'danger', onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className={`text-sm ${ui.body}`}>{body}</p>
    </Modal>
  );
}
