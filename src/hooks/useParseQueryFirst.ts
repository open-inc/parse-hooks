import Parse from "parse/node.js";
import React from "react";

type Result<T> = {
  result: T | undefined;
  loading: boolean;
  error: Error | undefined;
  reload: () => void;
};

export function useParseQueryFirst<T extends Parse.Object>(
  query: Parse.Query<T>
): Result<T> {
  const [state, setState] = React.useState<Result<T>>({
    result: undefined,
    loading: true,
    error: undefined,
    reload: fetch,
  });

  async function fetch() {
    if (query) {
      try {
        setState({
          result: await query.first(),
          loading: false,
          error: undefined,
          reload: fetch,
        });
      } catch (error) {
        setState({
          result: undefined,
          loading: false,
          error: error as Error,
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
  }, [query]);

  return state;
}
