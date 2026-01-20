import Parse from "parse/node.js";
import React from "react";

type Result<T> = {
  result: T | undefined;
  loading: boolean;
  error: Error | undefined;
  reload: () => void;
};

export function useParseFunction<T>(
  name: string,
  params: any,
  dependency?: any
): Result<T> {
  const [state, setState] = React.useState<Result<T>>({
    result: undefined,
    loading: true,
    error: undefined,
    reload: fetch,
  });

  async function fetch() {
    if (!name) {
      return;
    }

    Parse.Cloud.run(name, params).then(
      (response: any) => {
        setState({
          result: response,
          error: undefined,
          loading: false,
          reload: fetch,
        });
      },
      (error: Error) => {
        setState({
          result: undefined,
          error,
          loading: false,
          reload: fetch,
        });
      }
    );
  }

  React.useEffect(() => {
    setState({
      result: undefined,
      loading: true,
      error: undefined,
      reload: fetch,
    });

    fetch();
  }, [name, dependency]);

  return state;
}
