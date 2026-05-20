export type QueueItem = {
  id: string;
  room_id: string;
  track_uri: string;
  track_name: string;
  artist: string;
  added_by: string;
  position: number;
  played: boolean;
  votes: number;
  created_at: string;
};