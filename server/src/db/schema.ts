import Database from 'better-sqlite3';

function createTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      maps_api_key TEXT,
      unsplash_api_key TEXT,
      openweather_api_key TEXT,
      avatar TEXT,
      oidc_sub TEXT,
      oidc_issuer TEXT,
      last_login DATETIME,
      mfa_enabled INTEGER DEFAULT 0,
      mfa_secret TEXT,
      mfa_backup_codes TEXT,
      must_change_password INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value TEXT,
      UNIQUE(user_id, key)
    );

    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      currency TEXT DEFAULT 'EUR',
      cover_image TEXT,
      is_archived INTEGER DEFAULT 0,
      reminder_days INTEGER DEFAULT 3,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day_number INTEGER NOT NULL,
      date TEXT,
      notes TEXT,
      title TEXT,
      UNIQUE(trip_id, day_number)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      icon TEXT DEFAULT '📍',
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#10b981',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      lat REAL,
      lng REAL,
      address TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      price REAL,
      currency TEXT,
      reservation_status TEXT DEFAULT 'none',
      reservation_notes TEXT,
      reservation_datetime TEXT,
      place_time TEXT,
      end_time TEXT,
      duration_minutes INTEGER DEFAULT 60,
      notes TEXT,
      image_url TEXT,
      google_place_id TEXT,
      website TEXT,
      phone TEXT,
      transport_mode TEXT DEFAULT 'walking',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS place_tags (
      place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (place_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS day_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
      place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      order_index INTEGER DEFAULT 0,
      notes TEXT,
      reservation_status TEXT DEFAULT 'none',
      reservation_notes TEXT,
      reservation_datetime TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS packing_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      checked INTEGER DEFAULT 0,
      category TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day_id INTEGER REFERENCES days(id) ON DELETE SET NULL,
      place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      caption TEXT,
      taken_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trip_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
      reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day_id INTEGER REFERENCES days(id) ON DELETE SET NULL,
      place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
      assignment_id INTEGER REFERENCES day_assignments(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      reservation_time TEXT,
      reservation_end_time TEXT,
      location TEXT,
      confirmation_number TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      type TEXT DEFAULT 'other',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trip_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invited_by INTEGER REFERENCES users(id),
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(trip_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS day_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      time TEXT,
      icon TEXT DEFAULT '📝',
      sort_order REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      category TEXT NOT NULL DEFAULT 'Other',
      name TEXT NOT NULL,
      total_price REAL NOT NULL DEFAULT 0,
      persons INTEGER DEFAULT NULL,
      days INTEGER DEFAULT NULL,
      note TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Addon system
    CREATE TABLE IF NOT EXISTS addons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'global',
      icon TEXT DEFAULT 'Puzzle',
      enabled INTEGER DEFAULT 0,
      config TEXT DEFAULT '{}',
      sort_order INTEGER DEFAULT 0
    );

    -- Vacay addon tables
    CREATE TABLE IF NOT EXISTS vacay_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      block_weekends INTEGER DEFAULT 1,
      holidays_enabled INTEGER DEFAULT 0,
      holidays_region TEXT DEFAULT '',
      company_holidays_enabled INTEGER DEFAULT 1,
      carry_over_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(owner_id)
    );

    CREATE TABLE IF NOT EXISTS vacay_plan_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(plan_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS vacay_user_colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      color TEXT DEFAULT '#6366f1',
      UNIQUE(user_id, plan_id)
    );

    CREATE TABLE IF NOT EXISTS vacay_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      UNIQUE(plan_id, year)
    );

    CREATE TABLE IF NOT EXISTS vacay_user_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      vacation_days INTEGER DEFAULT 30,
      carried_over INTEGER DEFAULT 0,
      UNIQUE(user_id, plan_id, year)
    );

    CREATE TABLE IF NOT EXISTS vacay_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      UNIQUE(user_id, plan_id, date)
    );

    CREATE TABLE IF NOT EXISTS vacay_company_holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      UNIQUE(plan_id, date)
    );

    CREATE TABLE IF NOT EXISTS vacay_holiday_calendars (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id   INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
      region    TEXT NOT NULL,
      label     TEXT,
      color     TEXT NOT NULL DEFAULT '#fecaca',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS day_accommodations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
      start_day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
      end_day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
      check_in TEXT,
      check_out TEXT,
      confirmation TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Collab addon tables
    CREATE TABLE IF NOT EXISTS collab_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT DEFAULT 'General',
      title TEXT NOT NULL,
      content TEXT,
      color TEXT DEFAULT '#6366f1',
      pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS collab_polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      multiple INTEGER DEFAULT 0,
      closed INTEGER DEFAULT 0,
      deadline TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS collab_poll_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL REFERENCES collab_polls(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      option_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(poll_id, user_id, option_index)
    );

    CREATE TABLE IF NOT EXISTS collab_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      reply_to INTEGER REFERENCES collab_messages(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_collab_notes_trip ON collab_notes(trip_id);
    CREATE INDEX IF NOT EXISTS idx_collab_polls_trip ON collab_polls(trip_id);
    CREATE INDEX IF NOT EXISTS idx_collab_messages_trip ON collab_messages(trip_id);
  `);

  // Gear library & packing plan tables
  db.exec(`
    -- General-purpose sub-admin permissions
    CREATE TABLE IF NOT EXISTS user_permissions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission  TEXT NOT NULL,
      granted_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      granted_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, permission)
    );
    CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);

    -- System-wide gear tags (separate from user-scoped place tags)
    CREATE TABLE IF NOT EXISTS gear_tags (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      color      TEXT NOT NULL DEFAULT '#6366f1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Global gear library: items
    CREATE TABLE IF NOT EXISTS gear_items (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT NOT NULL,
      description      TEXT,
      notes            TEXT,
      is_personal      INTEGER NOT NULL DEFAULT 0,
      is_food          INTEGER NOT NULL DEFAULT 0,
      serving_unit     TEXT,
      quantity_formula TEXT NOT NULL DEFAULT 'fixed',
      base_quantity    INTEGER NOT NULL DEFAULT 1,
      created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_gear_items_name ON gear_items(name);

    -- Global gear library: containers
    CREATE TABLE IF NOT EXISTS gear_containers (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT NOT NULL,
      description    TEXT,
      capacity_notes TEXT,
      is_personal    INTEGER NOT NULL DEFAULT 0,
      created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Global gear library: vehicles
    CREATE TABLE IF NOT EXISTS gear_vehicles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Ordered tag junction tables
    CREATE TABLE IF NOT EXISTS gear_item_tags (
      gear_item_id INTEGER NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
      tag_id       INTEGER NOT NULL REFERENCES gear_tags(id) ON DELETE CASCADE,
      sort_order   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (gear_item_id, tag_id)
    );
    CREATE INDEX IF NOT EXISTS idx_gear_item_tags_item ON gear_item_tags(gear_item_id);

    CREATE TABLE IF NOT EXISTS gear_container_tags (
      gear_container_id INTEGER NOT NULL REFERENCES gear_containers(id) ON DELETE CASCADE,
      tag_id            INTEGER NOT NULL REFERENCES gear_tags(id) ON DELETE CASCADE,
      sort_order        INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (gear_container_id, tag_id)
    );
    CREATE INDEX IF NOT EXISTS idx_gear_container_tags_container ON gear_container_tags(gear_container_id);

    CREATE TABLE IF NOT EXISTS gear_vehicle_tags (
      gear_vehicle_id INTEGER NOT NULL REFERENCES gear_vehicles(id) ON DELETE CASCADE,
      tag_id          INTEGER NOT NULL REFERENCES gear_tags(id) ON DELETE CASCADE,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (gear_vehicle_id, tag_id)
    );
    CREATE INDEX IF NOT EXISTS idx_gear_vehicle_tags_vehicle ON gear_vehicle_tags(gear_vehicle_id);

    -- Packing templates
    CREATE TABLE IF NOT EXISTS gear_templates (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gear_template_tags (
      gear_template_id INTEGER NOT NULL REFERENCES gear_templates(id) ON DELETE CASCADE,
      tag_id           INTEGER NOT NULL REFERENCES gear_tags(id) ON DELETE CASCADE,
      sort_order       INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (gear_template_id, tag_id)
    );
    CREATE INDEX IF NOT EXISTS idx_gear_template_tags_template ON gear_template_tags(gear_template_id);

    CREATE TABLE IF NOT EXISTS gear_template_items (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id      INTEGER NOT NULL REFERENCES gear_templates(id) ON DELETE CASCADE,
      gear_item_id     INTEGER NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
      quantity         INTEGER NOT NULL DEFAULT 1,
      quantity_formula TEXT,
      sort_order       INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_gear_template_items_template ON gear_template_items(template_id);

    CREATE TABLE IF NOT EXISTS gear_template_containers (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id       INTEGER NOT NULL REFERENCES gear_templates(id) ON DELETE CASCADE,
      gear_container_id INTEGER NOT NULL REFERENCES gear_containers(id) ON DELETE CASCADE,
      sort_order        INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_gear_template_containers_template ON gear_template_containers(template_id);

    CREATE TABLE IF NOT EXISTS gear_template_assignments (
      template_item_id      INTEGER NOT NULL REFERENCES gear_template_items(id) ON DELETE CASCADE,
      template_container_id INTEGER NOT NULL REFERENCES gear_template_containers(id) ON DELETE CASCADE,
      PRIMARY KEY (template_item_id, template_container_id)
    );

    -- Trip guests (partial attendees — informational only)
    CREATE TABLE IF NOT EXISTS trip_guests (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id      INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      name         TEXT NOT NULL,
      days_present INTEGER NOT NULL DEFAULT 1,
      meals_count  INTEGER NOT NULL DEFAULT 0,
      notes        TEXT,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_trip_guests_trip ON trip_guests(trip_id);

    -- Trip packing plan
    CREATE TABLE IF NOT EXISTS trip_packing_plans (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id    INTEGER NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
      vehicle_id INTEGER REFERENCES gear_vehicles(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trip_plan_containers (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id           INTEGER NOT NULL REFERENCES trip_packing_plans(id) ON DELETE CASCADE,
      gear_container_id INTEGER REFERENCES gear_containers(id) ON DELETE SET NULL,
      custom_name       TEXT,
      person_label      TEXT,
      sort_order        INTEGER NOT NULL DEFAULT 0,
      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_trip_plan_containers_plan ON trip_plan_containers(plan_id);

    CREATE TABLE IF NOT EXISTS trip_plan_items (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id             INTEGER NOT NULL REFERENCES trip_packing_plans(id) ON DELETE CASCADE,
      gear_item_id        INTEGER REFERENCES gear_items(id) ON DELETE SET NULL,
      custom_name         TEXT,
      custom_notes        TEXT,
      checked             INTEGER NOT NULL DEFAULT 0,
      quantity            INTEGER NOT NULL DEFAULT 1,
      container_id        INTEGER REFERENCES trip_plan_containers(id) ON DELETE SET NULL,
      container_override  INTEGER NOT NULL DEFAULT 0,
      directly_in_vehicle INTEGER NOT NULL DEFAULT 0,
      sort_order          INTEGER NOT NULL DEFAULT 0,
      created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_trip_plan_items_plan ON trip_plan_items(plan_id);
    CREATE INDEX IF NOT EXISTS idx_trip_plan_items_container ON trip_plan_items(container_id);

    -- Global meal templates
    CREATE TABLE IF NOT EXISTS meal_templates (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      meal_type   TEXT NOT NULL DEFAULT 'dinner',
      notes       TEXT,
      created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_meal_templates_meal_type ON meal_templates(meal_type);

    CREATE TABLE IF NOT EXISTS meal_template_items (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_template_id    INTEGER NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
      gear_item_id        INTEGER REFERENCES gear_items(id) ON DELETE SET NULL,
      custom_food_name    TEXT,
      quantity_per_person REAL NOT NULL DEFAULT 1,
      unit                TEXT,
      notes               TEXT,
      sort_order          INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_meal_template_items_template ON meal_template_items(meal_template_id);

    -- Meal planning (per day)
    CREATE TABLE IF NOT EXISTS trip_meals (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id             INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day_id              INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
      meal_template_id    INTEGER REFERENCES meal_templates(id) ON DELETE SET NULL,
      meal_type           TEXT NOT NULL DEFAULT 'dinner',
      name                TEXT,
      notes               TEXT,
      sort_order          INTEGER NOT NULL DEFAULT 0,
      created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_trip_meals_day ON trip_meals(day_id);
    CREATE INDEX IF NOT EXISTS idx_trip_meals_trip ON trip_meals(trip_id);

    CREATE TABLE IF NOT EXISTS trip_meal_items (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id             INTEGER NOT NULL REFERENCES trip_meals(id) ON DELETE CASCADE,
      gear_item_id        INTEGER REFERENCES gear_items(id) ON DELETE SET NULL,
      custom_food_name    TEXT,
      quantity_per_person REAL NOT NULL DEFAULT 1,
      unit                TEXT,
      notes               TEXT,
      sort_order          INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_trip_meal_items_meal ON trip_meal_items(meal_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_places_trip_id ON places(trip_id);
    CREATE INDEX IF NOT EXISTS idx_places_category_id ON places(category_id);
    CREATE INDEX IF NOT EXISTS idx_days_trip_id ON days(trip_id);
    CREATE INDEX IF NOT EXISTS idx_day_assignments_day_id ON day_assignments(day_id);
    CREATE INDEX IF NOT EXISTS idx_day_assignments_place_id ON day_assignments(place_id);
    CREATE INDEX IF NOT EXISTS idx_place_tags_place_id ON place_tags(place_id);
    CREATE INDEX IF NOT EXISTS idx_place_tags_tag_id ON place_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id ON trip_members(trip_id);
    CREATE INDEX IF NOT EXISTS idx_trip_members_user_id ON trip_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_packing_items_trip_id ON packing_items(trip_id);
    CREATE INDEX IF NOT EXISTS idx_budget_items_trip_id ON budget_items(trip_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_trip_id ON reservations(trip_id);
    CREATE INDEX IF NOT EXISTS idx_trip_files_trip_id ON trip_files(trip_id);
    CREATE INDEX IF NOT EXISTS idx_day_notes_day_id ON day_notes(day_id);
    CREATE INDEX IF NOT EXISTS idx_photos_trip_id ON photos(trip_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_day_accommodations_trip_id ON day_accommodations(trip_id);

    CREATE TABLE IF NOT EXISTS assignment_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL REFERENCES day_assignments(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(assignment_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_assignment_participants_assignment ON assignment_participants(assignment_id);

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      resource TEXT,
      details TEXT,
      ip TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
  `);
}

export { createTables };
