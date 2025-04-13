create table if not exists scores (
  id serial primary key not null,
  username text not null,
  is_student boolean not null,
  created_at timestamptz not null default current_timestamp,

  score_total decimal not null,

  score_home                 json,
  score_free_episode         json,
  score_premium_episode      json,
  score_timetable            json,
  score_upcoming_program     json,
  score_broadcasting_program json,
  score_archived_program     json,
  score_series               json,
  score_not_found            json,

  flow_score_user_auth        json,
  flow_score_timetable_gutter json,
  flow_score_home_series      json,
  flow_score_timetable        json,
  flow_score_episode_play     json,
  flow_score_program_play     json
);

CREATE INDEX idx_scores_username_created_at_desc ON scores (username, created_at DESC);
CREATE INDEX idx_scores_score_total_desc ON scores (score_total DESC);
CREATE INDEX idx_scores_username ON scores (username);

CREATE VIEW ranked_scores AS
SELECT
  username,
  score_total as latest_score_total,
  created_at,
  RANK() OVER (ORDER BY score_total DESC) AS rank
FROM (
  SELECT DISTINCT ON (username)
    username,
    score_total,
    created_at
  FROM scores
  ORDER BY username, created_at DESC
) AS latest_scores;
