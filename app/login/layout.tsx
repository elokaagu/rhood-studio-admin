export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
      {children}
    </div>
  );
}
