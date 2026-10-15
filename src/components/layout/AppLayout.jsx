import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Footer from './Footer';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  const { mainRef } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] bg-gray-50 dark:bg-gray-950">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setMobileOpen(true)} />
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-4 p-3 sm:space-y-6 sm:p-6">{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
