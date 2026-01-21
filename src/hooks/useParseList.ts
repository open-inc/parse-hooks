import Parse from "parse";
import React from "react";

type Result<T> = {
  result: T[];
  count: number;
  loading: boolean;
  error: Error | undefined;
  reload: () => void;
};

export function useParseList<T extends Parse.Object>(
  cls: new (...args: any[]) => T,
  options?: { count?: boolean; includes?: string[] }
): Result<T> {
  const [state, setState] = React.useState<Result<T>>({
    result: [],
    count: 0,
    loading: true,
    error: undefined,
    reload: fetch,
  });

  async function fetch() {
    if (cls) {
      const query = new Parse.Query(cls);

      query.descending("updatedAt");

      if (options?.includes) {
        for (const include of options.includes) {
          query.include(include);
        }
      }

      try {
        setState({
          result: await query.find(),
          count: options?.count ? await query.count() : 0,
          error: undefined,
          loading: false,
          reload: fetch,
        });
      } catch (error) {
        setState({
          result: [],
          count: 0,
          error: error as Error,
          loading: false,
          reload: fetch,
        });
      }
    }
  }

  React.useEffect(() => {
    setState({
      result: [],
      count: 0,
      loading: true,
      error: undefined,
      reload: fetch,
    });

    fetch();
  }, [cls]);

  return state;
}
