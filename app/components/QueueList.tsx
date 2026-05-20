// app/components/QueueList.tsx
"use client";

import { QueueItem } from "@/types/queue";

type Props = {
  queue: QueueItem[];
  nowPlaying?: React.ReactNode;
  rowAction?: (item: QueueItem, index: number) => React.ReactNode;
};

export default function QueueList({ queue, nowPlaying, rowAction }: Props) {
  return (
    <div>
      {nowPlaying}

      <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Up next</p>

      {queue.length === 0 ? (
        <p className="text-zinc-400 italic">Queue is empty — add some songs</p>
      ) : (
        queue.map((item, i) => (
          <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-zinc-800 last:border-0">
            <span className="text-xs text-zinc-600 w-4 text-center shrink-0">{i + 1}</span>
            <div className="w-10 h-10 rounded-md bg-zinc-800 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.track_name}</p>
              <p className="text-xs text-zinc-500">{item.artist} · {item.added_by}</p>
            </div>
            {rowAction?.(item, i)}
          </div>
        ))
      )}
    </div>
  );
}