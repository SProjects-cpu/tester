import '../src/index.css';

export const metadata = {
  title: 'MAGIC - Startup Incubation CRM',
  description: 'Marathwada Accelerator for Growth Incubation Council - Startup Incubation Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
