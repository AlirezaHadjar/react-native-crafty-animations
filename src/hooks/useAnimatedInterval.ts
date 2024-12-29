/* eslint-disable no-underscore-dangle */
import { makeMutable } from "react-native-reanimated";

type AnyFunction = (...args: Array<any>) => any;

const RUNNING_INTERVALS = makeMutable<Record<string, boolean>>({});
const INTERVAL_ID = makeMutable(0);

export type AnimatedIntervalID = number;

export function setAnimatedInterval<F extends AnyFunction>(
  callback: F,
  interval: number,
): AnimatedIntervalID {
  "worklet";
  let startTimestamp: number;

  const currentId = INTERVAL_ID.value;
  RUNNING_INTERVALS.value[currentId] = true;
  INTERVAL_ID.value += 1;

  const step = (newTimestamp: number) => {
    if (!RUNNING_INTERVALS.value[currentId]) {
      return;
    }
    if (startTimestamp === undefined) {
      startTimestamp = newTimestamp;
    }
    if (newTimestamp >= startTimestamp + interval) {
      startTimestamp = newTimestamp;
      callback();
    }
    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);

  return currentId;
}

export function clearAnimatedInterval(handle: AnimatedIntervalID): void {
  "worklet";
  RUNNING_INTERVALS.modify((runningIntervals) => {
    "worklet";
    delete runningIntervals[handle];
    return runningIntervals;
  });
}
