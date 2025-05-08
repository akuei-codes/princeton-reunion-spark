-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('current_student', 'recent_grad', 'class_of_2025', 'alum');
CREATE TYPE user_vibe AS ENUM ('Looking to Party', 'Looking to Catch Up', 'Down to Roam', 'Looking for a Hook-Up');
CREATE TYPE user_gender AS ENUM ('male', 'female', 'non-binary', 'other');
CREATE TYPE gender_preference AS ENUM ('male', 'female', 'everyone');
CREATE TYPE user_intention AS ENUM ('casual', 'serious'); -- Added intention enum

-- Create users table with photo_urls array
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  class_year TEXT NOT NULL,
  role user_role NOT NULL,
  vibe user_vibe,
  gender user_gender,
  gender_preference gender_preference DEFAULT 'everyone',
  bio TEXT,
  major TEXT,
  location TEXT,
  building TEXT,
  latitude FLOAT,
  longitude FLOAT,
  photo_urls TEXT[] DEFAULT '{}', -- Store Cloudinary URLs as an array
  profile_complete BOOLEAN DEFAULT FALSE,
  intention user_intention DEFAULT 'casual', -- Added intention column
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user interests table
CREATE TABLE interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

-- Create user_interests junction table
CREATE TABLE user_interests (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interest_id UUID REFERENCES interests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, interest_id)
);

-- Create clubs table
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

-- Create user_clubs junction table
CREATE TABLE user_clubs (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, club_id)
);

-- Create swipes table to track user swipe activity
CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  swiped_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (swiper_id, swiped_id)
);

-- Create matches table derived from mutual right swipes
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_id_2 UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2) -- To avoid duplicate matches
);

-- Create messages table for chat functionality
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hot zones table
CREATE TABLE hot_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT,
  distance TEXT,
  active_users INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table for hot zone events
CREATE TABLE hot_zone_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hot_zone_id UUID REFERENCES hot_zones(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Princeton campus buildings for location selection
CREATE TABLE campus_buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL
);

-- Add some Princeton buildings with their coordinates
INSERT INTO campus_buildings (name, latitude, longitude) VALUES
  ('1901 Hall', 40.3461, -74.6551),
  ('Brown Hall', 40.3458, -74.6545),
  ('Frist Campus Center', 40.3470, -74.6548),
  ('Princeton Stadium', 40.3479, -74.6507),
  ('Lewis Library', 40.3458, -74.6529),
  ('Nassau Hall', 40.3489, -74.6579),
  ('Firestone Library', 40.3496, -74.6576),
  ('Whitman College', 40.3432, -74.6565),
  ('Forbes College', 40.3421, -74.6603),
  ('Princeton University Chapel', 40.3483, -74.6551),
  ('Friend Center', 40.3505, -74.6521);

-- Insert some sample data for testing
INSERT INTO interests (name) VALUES 
  ('Journalism'), ('Art'), ('Film'), ('Dancing'),
  ('Finance'), ('Running'), ('Beer Pong'), ('Travel'),
  ('Coding'), ('Music'), ('Coffee'), ('Hiking'),
  ('Reading'), ('Photography'), ('Gaming'), ('Cooking'),
  ('Sports'), ('Politics'), ('Science'), ('Math'),
  ('Theater');

INSERT INTO clubs (name) VALUES
  ('Terrace'), ('Daily Princetonian'), ('Tower'), ('Investment Club'),
  ('Quadrangle'), ('CS Club'), ('Tiger Inn'), ('Cannon Club'),
  ('Debate Club'), ('Drama Club'), ('Singing Club'), ('Robotics Team'),
  ('Chess Club'), ('Orchestra'), ('Choir'), ('Dance Company'),
  ('Princeton Review');

-- Create functions and triggers

-- Function to update updated_at field
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger for users table
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Function to create a match when there's a mutual right swipe
CREATE OR REPLACE FUNCTION create_match_on_mutual_swipe()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a mutual right swipe
  IF EXISTS (
    SELECT 1 FROM swipes 
    WHERE swiper_id = NEW.swiped_id 
    AND swiped_id = NEW.swiper_id 
    AND direction = 'right'
  ) AND NEW.direction = 'right' THEN
    -- Insert the match with the lower ID first (to maintain our check constraint)
    IF NEW.swiper_id < NEW.swiped_id THEN
      INSERT INTO matches (user_id_1, user_id_2)
      VALUES (NEW.swiper_id, NEW.swiped_id);
    ELSE
      INSERT INTO matches (user_id_1, user_id_2)
      VALUES (NEW.swiped_id, NEW.swiper_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger for creating matches
CREATE TRIGGER create_match_trigger
AFTER INSERT ON swipes
FOR EACH ROW
EXECUTE PROCEDURE create_match_on_mutual_swipe();

-- Add RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy for users table
CREATE POLICY users_select_policy ON users
  FOR SELECT
  USING (TRUE); -- Allow read of all users

-- Policy for users table - update own record
CREATE POLICY users_update_policy ON users
  FOR UPDATE
  USING (auth_id = auth.uid()::text); -- Cast uuid to text for comparison

-- Policy for users table - insert own record
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  WITH CHECK (auth_id = auth.uid()::text); -- Cast uuid to text for comparison

-- Policy for swipes table
CREATE POLICY swipes_insert_policy ON swipes
  FOR INSERT
  WITH CHECK (swiper_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text));

-- Policy for viewing swipes 
CREATE POLICY swipes_select_policy ON swipes
  FOR SELECT
  USING (swiper_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text));

-- Policy for matches table
CREATE POLICY matches_policy ON matches
  FOR SELECT
  USING (
    user_id_1 IN (SELECT id FROM users WHERE auth_id = auth.uid()::text) OR
    user_id_2 IN (SELECT id FROM users WHERE auth_id = auth.uid()::text)
  );

-- Policy for messages table
CREATE POLICY messages_policy ON messages
  FOR SELECT
  USING (
    match_id IN (
      SELECT id FROM matches WHERE 
      user_id_1 IN (SELECT id FROM users WHERE auth_id = auth.uid()::text) OR
      user_id_2 IN (SELECT id FROM users WHERE auth_id = auth.uid()::text)
    )
  );

-- Policy for inserting messages
CREATE POLICY messages_insert_policy ON messages
  FOR INSERT
  WITH CHECK (
    sender_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text) AND
    match_id IN (
      SELECT id FROM matches WHERE 
      user_id_1 IN (SELECT id FROM users WHERE auth_id = auth.uid()::text) OR
      user_id_2 IN (SELECT id FROM users WHERE auth_id = auth.uid()::text)
    )
  );
