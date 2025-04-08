import { useEffect, useState } from "preact/hooks";

type State =
  | Array<{ username: string; latest_score_total: number }>
  | { error: string }
  | null;

export function App() {
  const [state, setState] = useState<State>(null);

  useEffect(() => {
    (async () => {
      const m = await import("./db");
      const res = await m.supabase.from("ranked_scores").select().order("rank");
      setState(res.error == null ? res.data : { error: res.error.message });
    })();
  }, []);

  if (Array.isArray(state)) {
    return (
      <ul>
        {state.map((x, i) => (
          <li>
            #{i}: {x.username}: {x.latest_score_total}
          </li>
        ))}
      </ul>
    );
  }
}
