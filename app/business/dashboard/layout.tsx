import DashboardShell from "./_components/DashboardShell";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
