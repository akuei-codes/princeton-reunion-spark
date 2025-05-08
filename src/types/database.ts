
export type UserRole = 'current_student' | 'recent_grad' | 'class_of_2025' | 'alum';

export type UserVibe = 'Looking to Party' | 'Looking to Catch Up' | 'Down to Roam' | 'Looking for a Hook-Up';

export type UserGender = 'male' | 'female' | 'non-binary' | 'other';

export type GenderPreference = 'male' | 'female' | 'everyone';

export interface User {
  id: string;
  auth_id: string;
  name: string;
  class_year: string;
  role: UserRole;
  vibe?: UserVibe;
  gender?: UserGender;
  gender_preference?: GenderPreference;
  bio?: string;
  major?: string;
  location?: string;
  building?: string;
  latitude?: number;
  longitude?: number;
  photo_urls?: string[];
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
  intention?: 'casual' | 'serious'; // Add the intention property
  unread?: boolean; // Add this for UI display
}

export interface Interest {
  id: string;
  name: string;
}

export interface Club {
  id: string;
  name: string;
}

export interface CampusBuilding {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
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
  photos?: string[]; // Changed from UserPhoto[] to string[]
  interests: { name: Interest }[];
  clubs: { name: Club }[];
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
    time?: string; // Add this for time display
  };
}

export interface HotZoneWithEvents extends HotZone {
  events: HotZoneEvent[];
  matches_nearby: number;
}
