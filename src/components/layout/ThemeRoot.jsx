import { useApp } from '../../context/AppContext';

// Mirrors the prototype's outer wrappers: `.dark` scope plus base font/colors.
export default function ThemeRoot({ children }) {
  const { dark } = useApp();
  return (
    <div className={dark ? 'dark' : ''}>
      <div className="font-sans text-gray-900 antialiased dark:text-gray-100">{children}</div>
    </div>
  );
}
