import '../index.css';

export const metadata = {
  title: 'Digital Hub',
  description: 'Manage products, orders and customers across all your stores.',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950">{children}</body>
    </html>
  );
}
