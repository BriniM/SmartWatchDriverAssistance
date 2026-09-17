import {useEffect} from 'react';
import {NativeModules} from 'react-native';

type KeepAwakeNativeModule = {
  activate: () => void;
  deactivate: () => void;
};

const keepAwake = NativeModules.KeepAwake as KeepAwakeNativeModule | undefined;

export function activateKeepAwake() {
  keepAwake?.activate();
}

export function deactivateKeepAwake() {
  keepAwake?.deactivate();
}

export function useKeepAwake(active = true) {
  useEffect(() => {
    if (!active) {
      return;
    }
    activateKeepAwake();
    return () => deactivateKeepAwake();
  }, [active]);
}
