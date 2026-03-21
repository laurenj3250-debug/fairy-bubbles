import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";

interface RecentActivity {
  id: number;
  date: string;
  type: "adventure" | "climbing_day";
  activity: string;
  location: string | null;
  photoPath: string | null;
  thumbPath: string | null;
  notes: string | null;
}

export function SundownAdventures() {
  const { data: activities, isLoading, error } = useQuery<RecentActivity[]>({
    queryKey: ["/api/recent-outdoor-activities"],
    queryFn: async () => {
      const res = await fetch("/api/recent-outdoor-activities?limit=4");
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="aspect-square"
            style={{
              borderRadius: 12,
              background: 'rgba(80,50,35,0.2)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 14, color: 'var(--sd-accent-dark)' }}>
        Failed to load adventures
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Link href="/adventures">
        <div style={{
          textAlign: 'center',
          padding: '16px 0',
          fontSize: 14,
          color: 'var(--sd-text-muted)',
          cursor: 'pointer',
          transition: 'color 0.2s',
        }}>
          Log your first adventure
        </div>
      </Link>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {activities.slice(0, 4).map((activity) => (
        <Link key={`${activity.type}-${activity.id}`} href="/adventures">
          <div
            className="group"
            style={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: 12,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            {activity.photoPath || activity.thumbPath ? (
              <img
                src={activity.thumbPath || activity.photoPath || ""}
                alt={activity.activity}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 12,
                  transition: 'transform 0.2s',
                }}
                className="group-hover:scale-105"
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(80,50,35,0.15)',
                borderRadius: 12,
                fontSize: 24,
              }}>
                ⛰️
              </div>
            )}

            {/* Hover overlay */}
            <div
              className="opacity-0 group-hover:opacity-100"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15,10,8,0.7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                transition: 'opacity 0.2s',
                borderRadius: 12,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--sd-text-primary)', fontWeight: 500, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {format(new Date(activity.date), "MMM d")}
              </span>
              <span style={{ fontSize: 10, color: 'var(--sd-text-secondary)', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                {activity.activity}
              </span>
              {activity.location && (
                <span style={{ fontSize: 10, color: 'var(--sd-text-muted)', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {activity.location}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
