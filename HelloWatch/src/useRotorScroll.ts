import {useCallback, useRef} from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewInstance,
} from 'react-native';
import {useRotary} from './rotary';

export const ROTOR_SCROLL_STEP = 48;

export function useRotorScroll() {
  const ref = useRef<ScrollViewInstance>(null);
  const offset = useRef(0);
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);

  useRotary(step => {
    const maxOffset = Math.max(
      contentHeight.current - viewportHeight.current,
      0,
    );
    const next = Math.min(
      Math.max(offset.current + step * ROTOR_SCROLL_STEP, 0),
      maxOffset,
    );
    if (next !== offset.current) {
      ref.current?.scrollTo({y: next, animated: true});
    }
  });

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  const onContentSizeChange = useCallback((_width: number, height: number) => {
    contentHeight.current = height;
  }, []);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    viewportHeight.current = event.nativeEvent.layout.height;
  }, []);

  return {ref, onScroll, onContentSizeChange, onLayout};
}
