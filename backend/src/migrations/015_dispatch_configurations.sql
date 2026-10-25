-- Migration 015: Create dispatch_configurations table for technician matching rules
CREATE TABLE IF NOT EXISTS dispatch_configurations (
    id SERIAL PRIMARY KEY,
    auto_matching BOOLEAN DEFAULT TRUE,
    match_by_distance BOOLEAN DEFAULT TRUE,
    match_by_expertise BOOLEAN DEFAULT TRUE,
    match_by_workload BOOLEAN DEFAULT TRUE,
    priorities JSONB DEFAULT '[
      {"id":"p1","title":"Service Expertise & Certification","subtitle":"Class-4 gas-lift, Herman Miller authorized"},
      {"id":"p2","title":"Availability & Shift Timing","subtitle":"Immediate on-call vs scheduled routes"},
      {"id":"p3","title":"Distance & Transit Geofence","subtitle":"Shortest road transit ETA in minutes"},
      {"id":"p4","title":"Customer Rating & Fleet SLA","subtitle":"Historical 4.8+ ergonomic diagnostic rating"}
    ]',
    matching_radius_km INTEGER DEFAULT 10,
    max_assignment_attempts INTEGER DEFAULT 5,
    response_timeout_minutes INTEGER DEFAULT 5,
    is_engine_paused BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO dispatch_configurations (id, auto_matching, match_by_distance, match_by_expertise, match_by_workload, matching_radius_km, max_assignment_attempts, response_timeout_minutes, is_engine_paused)
VALUES (1, TRUE, TRUE, TRUE, TRUE, 10, 5, 5, FALSE)
ON CONFLICT (id) DO NOTHING;
