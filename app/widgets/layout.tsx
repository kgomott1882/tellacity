export const metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

export default function WidgetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No <html>/<body> - the root layout provides those.
  // This layout simply strips out navbar/footer (handled via ConditionalNavbar/Footer)
  // and wraps widget content in a clean, isolated container.
  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        background: "transparent",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {children}
    </div>
  );
}
