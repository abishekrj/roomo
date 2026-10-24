WITH groups AS (
  INSERT INTO "room_filter_groups" ("id","title","icon","sort_order","is_active","updated_at")
  VALUES
    (gen_random_uuid(),'Facilities and services','bi-building-check',6,true,CURRENT_TIMESTAMP),
    (gen_random_uuid(),'Meals','bi-cup-hot',7,true,CURRENT_TIMESTAMP),
    (gen_random_uuid(),'Accessibility','bi-universal-access',8,true,CURRENT_TIMESTAMP),
    (gen_random_uuid(),'Room facilities','bi-door-closed',9,true,CURRENT_TIMESTAMP)
  RETURNING "id","title"
)
INSERT INTO "room_filters" ("id","group_id","label","filter_type","value","sort_order","is_active","updated_at")
SELECT gen_random_uuid(),g."id",v.label,v.filter_type,v.value,v.sort_order,true,CURRENT_TIMESTAMP
FROM groups g
JOIN (VALUES
 ('Facilities and services','Free Wi-Fi','amenity','wifi',1),
 ('Facilities and services','Free parking','amenity','parking',2),
 ('Facilities and services','Air conditioning','amenity','ac',3),
 ('Facilities and services','24-hour front desk','amenity','front-desk-24h',4),
 ('Facilities and services','Lift','amenity','lift',5),
 ('Facilities and services','Heating','amenity','heating',6),
 ('Facilities and services','Airport shuttle','amenity','airport-shuttle',7),
 ('Facilities and services','Non-smoking rooms','amenity','non-smoking-rooms',8),
 ('Meals','Breakfast included','amenity','breakfast',1),
 ('Accessibility','Accessible facilities','amenity','accessible',1),
 ('Accessibility','Lift access','amenity','lift',2),
 ('Room facilities','Family rooms','room','family-rooms',1),
 ('Room facilities','Private bathroom','room','private',2),
 ('Room facilities','Quiet / meditation space','room','quiet',3),
 ('Room facilities','Air conditioning','room','ac',4),
 ('Room facilities','Hot water','room','hotwater',5),
 ('Room facilities','Non-smoking room','room','non-smoking-rooms',6)
) AS v(group_title,label,filter_type,value,sort_order) ON g."title"=v.group_title;
