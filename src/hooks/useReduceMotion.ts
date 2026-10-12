import { useReducedMotion } from 'react-native-reanimated';

/** True when the phone asks for less motion: no pin bounce, no sheet spring. */
export function useReduceMotion(): boolean {
  return useReducedMotion();
}
