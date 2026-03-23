/**
 * Minimal layout for widget embed pages.
 * Renders bare HTML - no global styles, no navbar, no providers.
 * Widgets are designed to be embedded inside iframes.
 */
export default function WidgetsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "transparent" }}>
        {children}
      </body>
    </html>
  );
}
