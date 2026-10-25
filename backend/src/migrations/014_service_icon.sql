-- Migration 014: Add icon column to services table and seed icons for existing services
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon VARCHAR(100) DEFAULT 'Wrench';

-- Seed appropriate icons for existing standard services based on code/title
UPDATE services SET icon = 'ArrowUp' WHERE code ILIKE '%hydraulic%' OR title ILIKE '%gas lift%';
UPDATE services SET icon = 'Settings' WHERE code ILIKE '%recline%' OR code ILIKE '%tilt%' OR title ILIKE '%tilt%' OR title ILIKE '%recline%';
UPDATE services SET icon = 'Disc' WHERE code ILIKE '%castor%' OR code ILIKE '%wheel%' OR title ILIKE '%wheel%' OR title ILIKE '%castor%';
UPDATE services SET icon = 'Armchair' WHERE code ILIKE '%armrest%' OR title ILIKE '%armrest%';
UPDATE services SET icon = 'Sparkles' WHERE code ILIKE '%spa%' OR code ILIKE '%clean%' OR title ILIKE '%clean%';
UPDATE services SET icon = 'Search' WHERE code ILIKE '%inspection%' OR code ILIKE '%audit%' OR title ILIKE '%inspect%';
UPDATE services SET icon = 'SlidersHorizontal' WHERE code ILIKE '%maintenance%' OR title ILIKE '%tune%';
UPDATE services SET icon = 'Package' WHERE code ILIKE '%installation%' OR title ILIKE '%install%';
UPDATE services SET icon = 'Wrench' WHERE icon IS NULL OR icon = '';
