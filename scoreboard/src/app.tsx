import { ReactNode } from "preact/compat";
import { useEffect, useState } from "preact/hooks";

interface ScoreData {
  username: string;
  latest_score_total: number;
}

type State = Array<ScoreData> | { error: string } | null;

function OutsideLink(props: { href: string; children: ReactNode }) {
  return (
    <a target="_blank" rel="noopener noreferrer" href={props.href}>
      {props.children}
    </a>
  );
}

function ScoreUser({ i, data }: { i: number; data: ScoreData }) {
  const { username, latest_score_total: score } = data;
  const green = "rgb(0, 204, 101)";
  const orange = "rgb(255, 170, 53)";
  const red = "rgb(250, 52, 53)";

  const color = score >= 710 ? green : score < 360 ? red : orange;

  return (
    <div className="font-mono p-4 flex justify-between items-center">
      <span>
        #{i + 1}:
        <OutsideLink href={`https://github.com/${username}`}>
          <img
            className="inline rounded-full w-[4rem] h-[4rem] mx-4"
            src={`https://github.com/${username}.png`}
          />
          {username}
        </OutsideLink>
      </span>
      <span className={`inline-block align-middle ${color}`} style={{ color }}>
        {score} / 1200 pt
      </span>
    </div>
  );
}

function ScoreSection(props: { data: Array<ScoreData> }) {
  return (
    <>
      <ul>
        {props.data.map((x, i) => (
          <li key={x.username}>
            <ScoreUser i={i} data={x} />
          </li>
        ))}
      </ul>
    </>
  );
}

function Scoreboard() {
  const [state, setState] = useState<State>(null);

  useEffect(() => {
    (async () => {
      const m = await import("./db");
      const res = await m.supabase.from("ranked_scores").select().order("rank");
      setState(res.error == null ? res.data : { error: res.error.message });
    })();
  }, []);

  if (state == null) {
    return <p className="font-mono text-center">Loading...</p>;
  }

  if ("error" in state) {
    return <p>Error: {state.error}</p>;
  }

  return <ScoreSection data={state} />;
}

export function App() {
  return (
    <div className="md:max-w-screen-md md:mx-auto">
      <div className="w-full mx-auto flex items-center flex-col my-4">
        <h1 className="font-bold text-xl">WebSpeedHackathon 2025</h1>
        <h2>限界開発鯖感想戦</h2>
        <div className="my-2">
          <OutsideLink href="https://x.com/UfiApprovers">
            <i className="m-2 inline-block text-2xl i-line-md-twitter-x" />
          </OutsideLink>
          <OutsideLink href="https://github.com/approvers">
            <i className="m-2 inline-block text-2xl i-line-md-github" />
          </OutsideLink>
        </div>
      </div>

      <Scoreboard />
    </div>
  );
}
