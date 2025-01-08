import { FC, ComponentProps } from 'react';
import { Stack } from 'expo-router';

import { useAuth } from '@/auth';
import { GlobalPreloader } from './global-preloader';

export interface RoutesProps extends ComponentProps<typeof Stack> {}

export const Routes: FC<RoutesProps> = ({ children, ...props }) => {
  const { isInitialized } = useAuth();

  return isInitialized ? <Stack {...props}>{children}</Stack> : <GlobalPreloader />
};