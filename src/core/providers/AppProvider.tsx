/**
 * Application root provider/layout provider
 * Wraps the entire application with necessary context providers
 */

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return <>{children}</>;
}
