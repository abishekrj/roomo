CREATE TABLE "room_filter_groups" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" VARCHAR(120) NOT NULL,
  "icon" VARCHAR(60) NOT NULL DEFAULT 'bi-sliders',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "room_filter_groups_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "room_filters" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "group_id" UUID NOT NULL,
  "label" VARCHAR(160) NOT NULL,
  "filter_type" VARCHAR(30) NOT NULL,
  "value" VARCHAR(160) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "room_filters_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "room_filters_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "room_filter_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "room_filter_groups_is_active_sort_order_idx" ON "room_filter_groups"("is_active", "sort_order");
CREATE INDEX "room_filters_group_id_is_active_sort_order_idx" ON "room_filters"("group_id", "is_active", "sort_order");
CREATE INDEX "room_filters_filter_type_value_idx" ON "room_filters"("filter_type", "value");

-- Seed the current ROOMO filter experience into the new editable structure.
WITH groups AS (
  INSERT INTO "room_filter_groups" ("id","title","icon","sort_order","is_active","updated_at")
  VALUES
    (gen_random_uuid(),'Stay type','bi-house-heart',1,true,CURRENT_TIMESTAMP),
    (gen_random_uuid(),'Guest rating','bi-star-fill',2,true,CURRENT_TIMESTAMP),
    (gen_random_uuid(),'Popular facilities','bi-stars',3,true,CURRENT_TIMESTAMP),
    (gen_random_uuid(),'Near landmarks','bi-geo',4,true,CURRENT_TIMESTAMP),
    (gen_random_uuid(),'Room preferences','bi-door-open',5,true,CURRENT_TIMESTAMP)
  RETURNING "id","title"
)
INSERT INTO "room_filters" ("id","group_id","label","filter_type","value","sort_order","is_active","updated_at")
SELECT gen_random_uuid(),g."id",v.label,v.filter_type,v.value,v.sort_order,true,CURRENT_TIMESTAMP
FROM groups g
JOIN (VALUES
 ('Stay type','Ashrams & Retreats','type','Ashrams & Retreats',1),
 ('Stay type','Vedic Mathas & Inns','type','Vedic Mathas & Inns',2),
 ('Stay type','Temple View Suites','type','Temple View Suites',3),
 ('Stay type','Heritage Haveli Homes','type','Heritage Haveli Homes',4),
 ('Guest rating','Excellent 4.5+','rating','4.5',1),
 ('Guest rating','Very good 4.0+','rating','4',2),
 ('Guest rating','Good 3.0+','rating','3',3),
 ('Popular facilities','Free Wi-Fi','amenity','wifi',1),
 ('Popular facilities','Free parking','amenity','parking',2),
 ('Popular facilities','Air conditioning','amenity','ac',3),
 ('Popular facilities','Breakfast included','amenity','breakfast',4),
 ('Popular facilities','Arunachala / temple view','amenity','view',5),
 ('Popular facilities','24-hour hot water','amenity','hotwater',6),
 ('Near landmarks','Annamalaiyar Temple','distance','temple',1),
 ('Near landmarks','Sri Ramanasramam','distance','ramana',2),
 ('Near landmarks','Girivalam pathway','distance','girivalam',3),
 ('Near landmarks','Central bus stand','distance','bus',4),
 ('Room preferences','Family rooms','room','family',1),
 ('Room preferences','Private bathroom','room','private',2),
 ('Room preferences','Quiet / meditation space','room','quiet',3),
 ('Room preferences','Accessibility features','room','accessible',4)
) AS v(group_title,label,filter_type,value,sort_order) ON g."title"=v.group_title;
