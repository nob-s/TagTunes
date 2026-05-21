"use client";

import { QueueItem } from "@/types/queue";

type Props = {
  queue: QueueItem[];
  rowAction?: (item: QueueItem, index: number) => React.ReactNode;
};

export default function QueueList({ queue, rowAction }: Props) {
  const orderedQueue = queue.toSorted((a, b) => a.position - b.position);
  const upNext = orderedQueue.filter(item => !item.played);
  const played = orderedQueue.filter(i => i.played);
  const last = played[played.length - 1];

  return (
    <div className="flex flex-col">
      {last && (
        <div className="flex items-center gap-3 bg-zinc-900 rounded-xl p-3 mb-5">
          {last.album_image
            ? <img src={last.album_image} className="w-12 h-12 rounded-md shrink-0 object-cover shadow-md" />
            : <div className="w-12 h-12 rounded-md bg-zinc-800 shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-[10px] text-green-500 font-semibold tracking-widest uppercase">Now Playing</span>
            </div>
            <p className="text-sm font-semibold truncate">{last.track_name}</p>
            <p className="text-xs text-zinc-500 truncate">{last.artist}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Up next</p>
      <div className="overflow-y-auto max-h-[60vh]">
        {upNext.length === 0 && !last ? (
          <p className="text-zinc-400 italic">Queue is empty — add some songs</p>
        ) : upNext.length === 0 ? (
          <p className="text-zinc-500 italic text-sm">Nothing else queued</p>
        ) : (
          upNext.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-zinc-800 last:border-0">
              <span className="text-xs text-zinc-600 w-4 text-center shrink-0">{i + 1}</span>
              {item.album_image
                ? <img src={item.album_image} className="w-9 h-9 rounded-md shrink-0 object-cover" />
                : <div className="w-9 h-9 rounded-md bg-zinc-800 shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.track_name}</p>
                <p className="text-xs text-zinc-500 truncate">{item.artist} · {item.added_by}</p>
              </div>
              {rowAction?.(item, i)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}