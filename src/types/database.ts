
export type UserRole = 'current_student' | 'recent_grad' | 'class_of_2025' | 'alum';

export type UserVibe = 'Looking to Party' | 'Looking to Catch Up' | 'Down to Roam' | 'Looking for a Hook-Up';

export interface User {
  id: string;
  auth_id: string;
  name: string;
  class_year: string;
  role: UserRole;
  vibe?: UserVibe;
  bio?: string;
  major?: string;
  location?: string;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  position: number;
  created_at: string;
}

export interface Interest {
  id: string;
  name: string;
}

export interface Club {
  id: string;
  name: string;
}

export interface Swipe {
  id: string;
  swiper_id: string;
  swiped_id: string;
  direction: 'left' | 'right';
  created_at: string;
}

export interface Match {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface HotZone {
  id: string;
  name: string;
  image_url?: string;
  distance?: string;
  active_users: number;
  created_at: string;
  updated_at: string;
}

export interface HotZoneEvent {
  id: string;
  hot_zone_id: string;
  name: string;
  created_at: string;
}

export interface UserWithRelations extends User {
  photos: UserPhoto[];
  interests: Interest[];
  clubs: Club[];
}

export interface MatchWithUserAndLastMessage {
  id: string;
  created_at: string;
  other_user: UserWithRelations;
  last_message?: {
    message: string;
    created_at: string;
    sender_id: string;
    read: boolean;
  };
}

export interface HotZoneWithEvents extends HotZone {
  events: HotZoneEvent[];
  matches_nearby: number;
}
