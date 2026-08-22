export const getInitialRoute = (hasAuthenticatedUser: boolean) =>
  hasAuthenticatedUser ? '/(tabs)/do' as const : '/(auth)/welcome' as const;
