import type { ReactNode } from "preact/compat";
import { useEffect, useState } from "preact/hooks";
import type { ScoreData } from "./db";

type State = Array<ScoreData> | { error: string } | null;

function OutsideLink(props: { href: string; children: ReactNode }) {
  return (
    <a target="_blank" rel="noopener noreferrer" href={props.href}>
      {props.children}
    </a>
  );
}

function ScoreUser({ rank, data }: { rank: number; data: ScoreData }) {
  const { username, latest_score_total: score } = data;
  const green = "rgb(0, 204, 101)";
  const orange = "rgb(255, 170, 53)";
  const red = "rgb(250, 52, 53)";

  const rankColor = rank === 1 ? "text-blue" : rank <= 3 ? "text-yellow" : "";
  const scoreColor = score >= 710 ? green : score < 360 ? red : orange;

  return (
    <div className="font-mono p-4 flex justify-between items-center">
      <span>
        <span className={rankColor}>#{rank}:</span>
        <OutsideLink href={`https://github.com/${username}`}>
          <img
            className="inline rounded-full w-[4rem] h-[4rem] mx-4"
            loading="lazy"
            decoding="async"
            alt={`GitHub icon for ${username}`}
            src={`https://github.com/${username}.png`}
          />
          {username}
        </OutsideLink>
      </span>
      <span className="inline-block align-middle" style={{ color: scoreColor }}>
        {score} / 1200 pt
      </span>
    </div>
  );
}

function ScoreSection(props: { data: Array<ScoreData> }) {
  return (
    <ul>
      {props.data.map((x, i) => (
        <li key={x.username}>
          <ScoreUser rank={i + 1} data={x} />
        </li>
      ))}
    </ul>
  );
}

function Scoreboard() {
  const [state, setState] = useState<State>(null);

  useEffect(() => {
    let gone = false;
    (async () => {
      const res = await (await import("./db")).getScoreboard();
      if (!gone) {
        setState("error" in res ? { error: res.error.message } : res);
      }
    })();
    return () => {
      gone = true;
    };
  }, []);

  if (state == null) {
    return <p className="font-mono text-center">Loading...</p>;
  }

  if ("error" in state) {
    return (
      <code className="font-mono text-center block whitespace-pre-wrap">
        Error: {JSON.stringify(state.error, null, 4)}
      </code>
    );
  }

  return <ScoreSection data={state} />;
}

export function App() {
  return (
    <div className="dark md:max-w-screen-md md:mx-auto">
      <div className="w-full mx-auto flex items-center flex-col my-4">
        <h1 className="font-bold text-xl">WebSpeedHackathon 2025</h1>
        <h2>限界開発鯖 感想戦</h2>
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
