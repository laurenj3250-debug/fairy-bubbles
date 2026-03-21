interface SundownHeroProps {
  tasksDone?: number;
  tasksTotal?: number;
  streak?: number;
}

export function SundownHero({
  tasksDone = 0,
  tasksTotal = 0,
  streak = 0,
}: SundownHeroProps) {
  return (
    <>
      <section className="sd-hero">
        <h1>Sundown</h1>
        <div className="sd-hero-pills">
          <div className="sd-pill">
            <div className="sd-pill-face">
              <span className="sd-pill-val">72&deg;</span> Clear
            </div>
          </div>
          <div className="sd-pill">
            <div className="sd-pill-face">
              <span className="sd-pill-val">{streak}</span> Streak
            </div>
          </div>
          <div className="sd-pill">
            <div className="sd-pill-face">
              <span className="sd-pill-val">{tasksDone}/{tasksTotal}</span> Today
            </div>
          </div>
        </div>
      </section>

      {/* Spacer to let the landscape breathe between title and cards */}
      <div className="sd-landscape-spacer" />
    </>
  );
}
