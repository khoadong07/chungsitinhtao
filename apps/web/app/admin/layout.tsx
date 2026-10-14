export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#020617', minHeight: '100vh' }}>
      {children}
    </div>
  );
}
