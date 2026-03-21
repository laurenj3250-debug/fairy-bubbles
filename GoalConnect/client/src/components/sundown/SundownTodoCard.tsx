import { SundownCard } from "./SundownCard";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

interface TodoItem {
  text: string;
  done: boolean;
  tag?: string;
}

const TODOS: TodoItem[] = [
  { text: "Morning RemNote review", done: true },
  { text: "Pimsleur lesson on bike", done: true },
  { text: "Submit I.E. Nephrology cards", done: true },
  { text: "Gym — upper body", done: true },
  { text: "Read de Lahunta Ch. 11", done: false, tag: "Study" },
  { text: "Practice Chopin exposition", done: false, tag: "Piano" },
  { text: "German WhatsApp to Adam", done: false, tag: "Deutsch" },
  { text: "Bed by 11pm", done: false, tag: "Health" },
];

/* ------------------------------------------------------------------ */
/*  Badge                                                              */
/* ------------------------------------------------------------------ */

function TodoBadge() {
  const doneCount = TODOS.filter((t) => t.done).length;
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "var(--sd-text-accent)",
        background: "rgba(200,131,73,0.15)",
        padding: "4px 12px",
        borderRadius: 12,
      }}
    >
      {doneCount}/{TODOS.length}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Checkbox                                                           */
/* ------------------------------------------------------------------ */

function TodoCheckbox({ checked }: { checked: boolean }) {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        minWidth: 22,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...(checked
          ? {
              background: "rgba(200,131,73,0.35)",
              boxShadow:
                "0 2px 4px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,228,195,0.12)",
            }
          : {
              background: "rgba(15,10,8,0.5)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
            }),
      }}
    >
      {checked && (
        <span
          style={{
            fontSize: 12,
            color: "var(--sd-text-primary)",
            lineHeight: 1,
          }}
        >
          ✓
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Todo row                                                           */
/* ------------------------------------------------------------------ */

function TodoRow({ item, isLast }: { item: TodoItem; isLast: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: isLast ? "none" : "1px solid rgba(255,200,140,0.04)",
      }}
    >
      <TodoCheckbox checked={item.done} />

      <span
        style={{
          flex: 1,
          fontSize: 14,
          color: item.done
            ? "var(--sd-text-muted)"
            : "var(--sd-text-secondary)",
          textDecoration: item.done ? "line-through" : "none",
          opacity: item.done ? 0.6 : 1,
        }}
      >
        {item.text}
      </span>

      {item.tag && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "var(--sd-text-accent)",
            opacity: 0.7,
          }}
        >
          {item.tag}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SundownTodoCard                                                    */
/* ------------------------------------------------------------------ */

export function SundownTodoCard() {
  return (
    <SundownCard title="To-Do List" headerRight={<TodoBadge />}>
      {TODOS.map((item, i) => (
        <TodoRow
          key={item.text}
          item={item}
          isLast={i === TODOS.length - 1}
        />
      ))}
    </SundownCard>
  );
}
