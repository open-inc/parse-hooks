import React from "react";

type Result<T> = [T, (value: Partial<T>) => void, () => void];

export function useObjectState<T>(initialState: T): Result<T> {
  const [state, setState] = React.useState<T>(initialState);

  const set = React.useCallback(
    (value: Partial<T>) => {
      setState((currentState: T) => {
        return { ...currentState, ...value };
      });
    },
    [setState]
  );

  const reset = React.useCallback(() => {
    setState(initialState);
  }, [setState, initialState]);

  return React.useMemo(() => [state, set, reset], [state, set, reset]);
}
