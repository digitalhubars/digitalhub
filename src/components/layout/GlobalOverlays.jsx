import { useApp } from '../../context/AppContext';
import CustomerDrawer from '../../features/customers/CustomerDrawer';
import OrderDrawer from '../../features/orders/OrderDrawer';
import ConfirmDialog from '../ui/ConfirmDialog';
import Toast from '../ui/Toast';

// App-wide layers: detail drawers, confirm dialog and the sync toast.
export default function GlobalOverlays() {
  const { drawer, closeDrawer, orders, customers, confirmDialog, closeConfirm, toast, dismissToast } = useApp();
  const order = drawer?.type === 'order' && orders.find((o) => o.id === drawer.id);
  const customer = drawer?.type === 'customer' && customers.find((c) => c.id === drawer.id);

  return (
    <>
      {order && <OrderDrawer order={order} onClose={closeDrawer} />}
      {customer && <CustomerDrawer customer={customer} onClose={closeDrawer} />}
      {confirmDialog && <ConfirmDialog {...confirmDialog} onClose={closeConfirm} />}
      <Toast toast={toast} onClose={dismissToast} />
    </>
  );
}
