import Parse from "parse/node.js";
import React from "react";

type Result<T> = {
  result: T[];
  count: number;
  loading: boolean;
  error: Error | undefined;
  reload: () => void;
};

export function useParseQuery<T extends Parse.Object>(
  query: Parse.Query<T>,
  options?: {
    count?: boolean;
    live?: boolean;
    liveReload?: boolean;
    reloadThrottle?: number;
  }
): Result<T> {
  const subscriptionRef = React.useRef<Parse.LiveQuerySubscription>();
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>();
  const throttleRef = React.useRef<boolean>(false);

  const initialState = {
    result: [],
    count: 0,
    loading: true,
    error: undefined,
    reload: fetch,
  };

  const [state, setState] = React.useState<Result<T>>(initialState);

  async function fetch(force: boolean = false) {
    if (
      !force &&
      options?.reloadThrottle &&
      Number.isInteger(options?.reloadThrottle)
    ) {
      if (timeoutRef.current) {
        throttleRef.current = true;
        return;
      } else {
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;

          if (throttleRef.current) {
            fetch();
          }

          throttleRef.current = false;
        }, options.reloadThrottle);
      }
    }

    if (query) {
      if (options?.live) {
        if (subscriptionRef.current) {
          await subscriptionRef.current.unsubscribe();
        }

        subscriptionRef.current = await query.subscribe();

        // subscriptionRef.current.on("open", () => {});

        subscriptionRef.current.on("create", (object: T) => {
          if (options?.liveReload) {
            fetch();
          } else {
            setState(mergeResult(object, true));
          }
        });

        subscriptionRef.current.on("update", (object: T) => {
          if (options?.liveReload) {
            fetch();
          } else {
            setState(mergeResult(object, true));
          }
        });

        subscriptionRef.current.on("enter", (object: T) => {
          if (options?.liveReload) {
            fetch();
          } else {
            setState(mergeResult(object, true));
          }
        });

        subscriptionRef.current.on("leave", (object: T) => {
          if (options?.liveReload) {
            fetch();
          } else {
            setState(mergeResult(object));
          }
        });
      }

      const requests: [Promise<T[]>, Promise<number>] = [
        query.find(),
        options?.count ? query.count() : Promise.resolve(0),
      ];

      Promise.all(requests).then(
        ([response, count]) => {
          if (Array.isArray(response)) {
            setState(
              mergeState({
                result: response,
                count: count || 0,
                loading: false,
              })
            );
          } else {
            setState(
              mergeState({ error: new Error("Bad Response"), loading: false })
            );
          }
        },
        (error: Error) => {
          setState(mergeState({ error, loading: false }));
        }
      );
    }
  }

  function mergeState(
    nextState: Partial<Result<T>>
  ): (state: Result<T>) => Result<T> {
    return (state) => Object.assign({}, state, nextState);
  }

  function mergeResult(
    object: T,
    add: boolean = false
  ): (state: Result<T>) => Result<T> {
    return (state) => {
      const result = state.result.filter((e) => e.id !== object.id);

      if (add) {
        result.push(object);
      }

      return Object.assign({}, state, { result });
    };
  }

  React.useEffect(() => {
    setState(initialState);
    fetch(true);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [query]);

  return state;
}
