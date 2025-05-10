export type UserGender = 'male' | 'female' | 'non-binary' | 'other';
export type GenderPreference = 'male' | 'female' | 'everyone';
export type UserVibe = 'Looking to Party' | 'Looking to Catch Up' | 'Down to Roam' | 'Looking for a Hook-Up';
export type UserIntention = 'casual' | 'serious';

export interface User {
  id: string;
  auth_id: string;
  name: string;
  class_year?: string;
  role?: string;
  vibe?: UserVibe;
  intention?: UserIntention;
  gender?: UserGender;
  gender_preference?: GenderPreference;
  bio?: string;
  major?: string;
  location?: string;
  building?: string;
  latitude?: number;
  longitude?: number;
  photo_urls?: string[];
  profile_complete?: boolean;
  created_at?: string;
  updated_at?: string;
  settings?: Record<string, any>;
}

export interface Interest {
  id: string;
  name: string;
}

export interface Club {
  id: string;
  name: string;
}

export interface UserWithRelations extends User {
  interests: { name: Interest }[];
  clubs: { name: Club }[];
}
