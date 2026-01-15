// This layout removes the settings header for the role creation wizard
// Children will have full control over their layout
export default function NewRoleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
