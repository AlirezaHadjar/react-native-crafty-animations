/* eslint-disable no-underscore-dangle */
import { makeMutable } from "react-native-reanimated";

type AnyFunction = (...args: Array<any>) => any;

const PENDING_TIMEOUTS = makeMutable<Record<string, boolean>>({});
const TIMEOUT_ID = makeMutable(0);

export type AnimatedTimeoutID = number;

function removeFromPendingTimeouts(id: AnimatedTimeoutID): void {
  "worklet";
  PENDING_TIMEOUTS.modify((pendingTimeouts) => {
    "worklet";
    delete pendingTimeouts[id];
    return pendingTimeouts;
  });
}

export function setAnimatedTimeout<F extends AnyFunction>(
  callback: F,
  delay: number,
): AnimatedTimeoutID {
  "worklet";
  let startTimestamp: number;

  const currentId = TIMEOUT_ID.value;
  PENDING_TIMEOUTS.value[currentId] = true;
  TIMEOUT_ID.value += 1;

  const step = (newTimestamp: number) => {
    if (!PENDING_TIMEOUTS.value[currentId]) {
      return;
    }
    if (startTimestamp === undefined) {
      startTimestamp = newTimestamp;
    }
    if (newTimestamp >= startTimestamp + delay) {
      removeFromPendingTimeouts(currentId);
      callback();
      return;
    }
    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);

  return currentId;
}

export function clearAnimatedTimeout(handle: AnimatedTimeoutID): void {
  "worklet";
  removeFromPendingTimeouts(handle);
}
