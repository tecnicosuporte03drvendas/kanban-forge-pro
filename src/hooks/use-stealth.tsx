import { useAuth } from '@/contexts/AuthContext';

export const useStealth = () => {
  const { isStealthMode, stealthMasterId } = useAuth();

  return {
    isStealthMode,
    stealthMasterId,
    shouldSuppressLogs: isStealthMode,
    shouldHideActivity: isStealthMode,
  };
};