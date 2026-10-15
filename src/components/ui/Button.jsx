import { btn, ui } from '../../styles/ui';

// variant: 'primary' | 'secondary' | 'danger'; size: 'sm' for the compact table buttons.
// Defaults to type="button"; pass type="submit" inside forms.
export default function Button({ variant = 'secondary', size, className = '', type = 'button', ...props }) {
  const extra = [size === 'sm' && ui.sm, className].filter(Boolean).join(' ');
  return <button type={type} className={btn(variant, extra)} {...props} />;
}
