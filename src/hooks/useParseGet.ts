import Parse from "parse";
import React from "react";

type Result<T> = {
  result: T | undefined;
  loading: boolean;
  error: Error | undefined;
  reload: () => void;
};

export function useParseGet<T extends Parse.Object>(
  cls: new (...args: any[]) => T,
  id: string,
  options?: { includes?: string[] }
): Result<T> {
  const [state, setState] = React.useState<Result<T>>({
    result: undefined,
    loading: true,
    error: undefined,
    reload: fetch,
  });

  async function fetch() {
    if (cls && id) {
      const query = new Parse.Query(cls);

      if (options?.includes) {
        for (const include of options.includes) {
          query.include(include);
        }
      }

      try {
        setState({
          result: (await query.get(id)) as T,
          loading: false,
          error: undefined,
          reload: fetch,
        });
      } catch (error) {
        setState({
          result: undefined,
          error: error as Error,
          loading: false,
          reload: fetch,
        });
      }
    }
  }

  React.useEffect(() => {
    setState({
      result: undefined,
      loading: true,
      error: undefined,
      reload: fetch,
    });

    fetch();
  }, [cls, id]);

  return state;
}
