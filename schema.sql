-- 1. ワインマスター（インポーターが管理する全商品）
CREATE TABLE wines_master (
    id TEXT PRIMARY KEY,
    name_jp TEXT,
    name_en TEXT,
    country TEXT,
    region TEXT,
    grape TEXT,
    color TEXT,
    type TEXT,
    vintage TEXT,
    alcohol TEXT,
    ai_explanation TEXT,
    menu_short TEXT,
    pairing TEXT,
    flavor_profile TEXT, -- JSON文字列
    aroma_features TEXT,
    tags TEXT,
    best_drinking TEXT,
    image_url TEXT,
    is_priority INTEGER DEFAULT 0 -- 1なら自社輸入品として猛烈にプッシュ
);

-- 2. 店舗別在庫・価格設定
CREATE TABLE store_inventory (
    store_id TEXT,
    wine_id TEXT,
    price_bottle INTEGER,
    price_glass INTEGER,
    stock INTEGER,
    is_visible INTEGER DEFAULT 1,
    PRIMARY KEY (store_id, wine_id)
);

-- 3. 店舗設定
CREATE TABLE store_configs (
    store_email TEXT PRIMARY KEY,
    store_name TEXT,
    slug TEXT UNIQUE,
    theme_color TEXT
);
