import {useEffect, useRef} from 'react';
import {EmitterSubscription, DeviceEventEmitter} from 'react-native';

export const ROTARY_EVENT = 'rotaryScroll';

export function addRotaryListener(
  listener: (delta: number) => void,
): EmitterSubscription {
  return DeviceEventEmitter.addListener(ROTARY_EVENT, listener);
}

export function useRotary(onStep: (step: number) => void) {
  const handler = useRef(onStep);
  handler.current = onStep;

  useEffect(() => {
    let accumulated = 0;
    const subscription = addRotaryListener((delta: number) => {
      accumulated += delta;
      while (accumulated >= 1) {
        accumulated -= 1;
        handler.current(1);
      }
      while (accumulated <= -1) {
        accumulated += 1;
        handler.current(-1);
      }
    });

    return () => subscription.remove();
  }, []);
}
