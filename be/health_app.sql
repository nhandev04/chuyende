BEGIN TRANSACTION;
CREATE TABLE ai_reports (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	food_log_id INTEGER, 
	original_prediction VARCHAR NOT NULL, 
	user_correction VARCHAR NOT NULL, 
	status VARCHAR, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(food_log_id) REFERENCES food_logs (id)
);
INSERT INTO "ai_reports" VALUES(1,4,NULL,'Sauce','Avocado','pending','2026-09-02 07:01:28.015222');
CREATE TABLE food_database (
	id INTEGER NOT NULL, 
	food_name VARCHAR NOT NULL, 
	category VARCHAR, 
	calories_per_100g FLOAT NOT NULL, 
	protein_per_100g FLOAT, 
	carbs_per_100g FLOAT, 
	fat_per_100g FLOAT, 
	image_url VARCHAR, 
	PRIMARY KEY (id)
);
INSERT INTO "food_database" VALUES(1,'Beef Noodle Soup (Pho)','Noodle',106.0,5.8,12.8,3.1,NULL);
INSERT INTO "food_database" VALUES(2,'Broken Rice with Grilled Pork','Rice',144.0,7.6,15.0,5.6,NULL);
INSERT INTO "food_database" VALUES(3,'Grilled Chicken Breast Salad','Healthy',91.4,10.0,5.1,3.0,NULL);
INSERT INTO "food_database" VALUES(4,'Vietnamese Pork Baguette (Banh Mi)','Bakery',250.0,9.5,38.0,6.8,NULL);
INSERT INTO "food_database" VALUES(5,'Grilled Pork Rice Vermicelli','Noodle',148.0,8.0,17.5,4.0,NULL);
INSERT INTO "food_database" VALUES(6,'Fresh Spring Rolls with Shrimp & Pork','Appetizer',120.0,7.0,18.0,2.2,NULL);
INSERT INTO "food_database" VALUES(7,'Greek Plain Unsweetened Yogurt','Dessert',63.0,5.3,7.0,1.5,NULL);
CREATE TABLE food_logs (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	meal_type VARCHAR NOT NULL, 
	food_name VARCHAR NOT NULL, 
	weight_g FLOAT, 
	calories FLOAT NOT NULL, 
	protein_g FLOAT, 
	carbs_g FLOAT, 
	fat_g FLOAT, 
	image_url VARCHAR, 
	confidence_score FLOAT, 
	logged_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
INSERT INTO "food_logs" VALUES(1,4,'lunch','Cucumber',400.0,480.0,26.5,58.0,14.2,'blob:http://localhost:4173/7d89c79b-4fe0-4690-b8e5-844a2bdc31db',0.95,'2026-09-02 06:59:12.753723');
INSERT INTO "food_logs" VALUES(2,4,'lunch','Strawberry',400.0,480.0,26.5,58.0,14.2,'blob:http://localhost:4173/7e2bb6d9-1075-4600-8c76-c081193d8a1e',0.95,'2026-09-02 06:59:39.131639');
INSERT INTO "food_logs" VALUES(3,4,'dinner','Steak',400.0,480.0,26.5,58.0,14.2,'blob:http://localhost:4173/d2d35a24-41c5-4c8a-b184-74c5b8ad0ac2',0.95,'2026-09-02 07:00:30.239757');
INSERT INTO "food_logs" VALUES(4,3,'breakfast','Salmon & Straw Mushroom Heart-Healthy Oat Porridge',350.0,340.0,24.0,40.0,7.0,NULL,0.95,'2026-09-05 08:27:25.230325');
CREATE TABLE rag_meal_plans (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	plan_tier VARCHAR NOT NULL, 
	target_calories FLOAT NOT NULL, 
	plan_title VARCHAR, 
	summary_advice TEXT, 
	meal_data TEXT NOT NULL, 
	grocery_list TEXT, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
INSERT INTO "rag_meal_plans" VALUES(1,3,'pro',1500.0,'✨ Cardio-Protective & Lipid-Lowering RAG AI Meal Plan','As a Clinical Medical Nutrition Specialist, this personalized plan is meticulously designed for your high blood fat (hyperlipidemia) management while maintaining your weight. It emphasizes soluble dietary fiber from whole grains (oats and brown rice) and beta-glucans to help bind and reduce LDL cholesterol absorption in the gut. Omega-3 fatty acids from fresh salmon and healthy unsaturated fats from walnuts and almonds are incorporated to support healthy triglyceride and HDL profiles. All saturated fats, fried foods, and refined sugars are strictly eliminated to protect your cardiovascular health.','[{"meal_type": "breakfast", "meal_label": "Breakfast", "meal_name": "Salmon & Straw Mushroom Heart-Healthy Oat Porridge", "portion": "1 Bowl (320g)", "calories": 340.0, "protein_g": 24.0, "carbs_g": 40.0, "fat_g": 7.0, "recipe_notes": "Whole grain oats rich in beta-glucan cooked gently with fresh salmon chunks and vitamin-rich straw mushrooms. Excellent for lowering LDL cholesterol."}, {"meal_type": "lunch", "meal_label": "Lunch", "meal_name": "Lean Beef & Garlic Sesame Brown Rice Noodle Bowl", "portion": "1 Large Bowl (400g)", "calories": 490.0, "protein_g": 35.0, "carbs_g": 52.0, "fat_g": 9.0, "recipe_notes": "Tender lean beef sautéed with aromatic garlic and a touch of heart-healthy sesame oil, served over low-GI brown rice noodles with fresh herbs."}, {"meal_type": "dinner", "meal_label": "Dinner", "meal_name": "Lemongrass Tofu & King Oyster Mushroom Plant-Based Broth", "portion": "1 Bowl (450g)", "calories": 460.0, "protein_g": 25.0, "carbs_g": 62.0, "fat_g": 8.0, "recipe_notes": "Naturally sweetened fragrant lemongrass broth featuring air-fried plant-based tofu and fibre-packed king oyster mushrooms to support lipid metabolism."}, {"meal_type": "snack", "meal_label": "Snack", "meal_name": "Low-Sugar Homemade Walnut, Almond & Oat Nut Milk", "portion": "1 Glass (250ml)", "calories": 210.0, "protein_g": 8.0, "carbs_g": 22.0, "fat_g": 9.0, "recipe_notes": "Nutrient-dense nut milk packed with essential plant sterols and unsaturated fatty acids to naturally enhance your blood lipid profile."}]','["Fresh salmon fillets", "Straw mushrooms", "Rolled whole oats", "Lean beef cut", "Brown rice noodles", "Sesame oil and fresh garlic", "Firm tofu", "King oyster mushrooms", "Lemongrass and fresh aromatic herbs", "Raw walnuts", "Raw almonds"]','2026-09-05 08:27:01.580184');
INSERT INTO "rag_meal_plans" VALUES(2,2,'pro',1950.0,'✨ Personalized AI Smart Weight Loss Meal Plan','As your Clinical Medical Nutrition Specialist, I have designed this 1950 kcal daily smart meal plan to promote sustainable fat loss while preserving lean muscle mass. Since you have no special dietary restrictions or allergies, we have incorporated a balanced macronutrient distribution emphasizing high-quality lean proteins, complex low-GI carbohydrates, and essential healthy fats. Ensure proper hydration throughout the day and pair this nutrition plan with consistent physical activity to optimize your metabolic rate.','[{"meal_type": "breakfast", "meal_label": "Breakfast", "meal_name": "Avocado Banana Whey Protein & Oat Smoothie", "portion": "1 Large Glass (400ml)", "calories": 487.5, "protein_g": 30.0, "carbs_g": 65.0, "fat_g": 10.0, "recipe_notes": "Blended ripe avocado, banana, oats, and Whey Isolate protein powder designed for sustained morning energy and fast recovery."}, {"meal_type": "lunch", "meal_label": "Lunch", "meal_name": "Tofu & Edamame Quinoa Buddha Bowl with Steamed Bok Choy", "portion": "1 Deep Bowl (450g)", "calories": 682.5, "protein_g": 42.0, "carbs_g": 78.0, "fat_g": 16.0, "recipe_notes": "Rich in plant protein and slow-digesting complex carbs, perfect for steady blood glucose levels and prolonged satiety."}, {"meal_type": "dinner", "meal_label": "Dinner", "meal_name": "Grilled Tiger Prawn & Avocado Salad with Lemon Olive Oil Dressing", "portion": "1 Large Platter (380g)", "calories": 585.0, "protein_g": 45.0, "carbs_g": 25.0, "fat_g": 22.0, "recipe_notes": "Grilled prawns served with crisp romaine lettuce and fresh avocado packed with heart-healthy monounsaturated fats."}, {"meal_type": "snack", "meal_label": "Snack", "meal_name": "Low-Sugar Walnut Almond & Oat Nut Milk", "portion": "1 Tall Glass (250ml)", "calories": 195.0, "protein_g": 8.0, "carbs_g": 20.0, "fat_g": 9.0, "recipe_notes": "Nutrient-rich nut milk providing unsaturated healthy fats and essential omega-3s to support optimal metabolic function."}]','["Whey Isolate Protein Powder", "Ripe Bananas", "Avocados", "Rolled Oats", "Firm Tofu", "Shelled Edamame", "Quinoa", "Fresh Bok Choy", "Tiger Prawns", "Romaine Lettuce", "Extra Virgin Olive Oil", "Fresh Lemons", "Almonds", "Walnuts"]','2026-09-19 03:33:27.631205');
INSERT INTO "rag_meal_plans" VALUES(3,1,'pro',2400.0,'✨ Professional Clinical Maintenance Smart Meal Plan','As your Clinical Medical Nutrition Specialist, I have tailored this 2400 kcal maintenance meal plan to fully support your weight stability and daily energy expenditure. With no special dietary restrictions or allergies noted, this plan integrates high-quality lean proteins, complex low-GI carbohydrates, and essential micronutrients across four balanced meals. Ensure proper hydration throughout the day and pair this nutritional intake with consistent physical activity to maintain optimal metabolic health.','[{"meal_type": "breakfast", "meal_label": "Breakfast", "meal_name": "Organic Omelet Roll with King Oyster Mushrooms & Asparagus Enhanced Portion", "portion": "2 Large Servings (approx. 450g)", "calories": 600.0, "protein_g": 42.0, "carbs_g": 22.0, "fat_g": 26.0, "recipe_notes": "Organic eggs pan-seared and rolled with sliced mushrooms and fresh asparagus, scaled to meet your morning macronutrient targets."}, {"meal_type": "lunch", "meal_label": "Lunch", "meal_name": "Double Portion Bitter Melon & King Oyster Mushroom Stir-Fry with Brown Rice", "portion": "Large Plate (approx. 600g)", "calories": 840.0, "protein_g": 36.0, "carbs_g": 120.0, "fat_g": 14.0, "recipe_notes": "Bitter melon is clinically known for natural bioactive compounds supporting insulin sensitivity, combined with fiber-rich brown rice."}, {"meal_type": "dinner", "meal_label": "Dinner", "meal_name": "Hearty Steamed Pumpkin, Chickpea & Spinach Coconut Curry Broth Bowl", "portion": "Large Bowl (approx. 700g)", "calories": 660.0, "protein_g": 32.0, "carbs_g": 90.0, "fat_g": 14.0, "recipe_notes": "High fiber chickpeas and fresh pumpkin simmered in light coconut broth with minimal glycemic impact to promote steady overnight digestion."}, {"meal_type": "snack", "meal_label": "Snack", "meal_name": "Avocado Banana Whey Protein & Oat Smoothie Power Blend", "portion": "1 Large Shaker Bottle (500ml)", "calories": 300.0, "protein_g": 26.0, "carbs_g": 34.0, "fat_g": 6.0, "recipe_notes": "Blended ripe avocado, banana, and Whey Isolate protein powder optimized for sustained energy and muscle recovery."}]','["Organic eggs", "King oyster mushrooms", "Fresh asparagus", "Bitter melon", "Brown rice", "Fresh pumpkin", "Chickpeas", "Fresh spinach", "Light coconut milk", "Ripe avocado", "Bananas", "Whey Isolate protein powder", "Oats"]','2026-09-19 03:43:52.060460');
INSERT INTO "rag_meal_plans" VALUES(8,1,'pro',2400.0,'✨ Personalized Clinical Maintenance Smart Meal Plan','Since you have no special dietary restrictions or allergies, this Pro-tier meal plan is specifically balanced to maintain your current energy expenditure (TDEE: 2400 kcal) while optimizing lean muscle mass and metabolic health. It incorporates high-quality lean proteins, complex low-GI carbohydrates, and essential omega-3 fatty acids. Ensure adequate daily hydration and consistent meal timing to support steady energy levels throughout the day.','[{"meal_type": "breakfast", "meal_label": "Breakfast", "meal_name": "Salmon & Straw Mushroom Oat Porridge", "portion": "1 Large Bowl (400g)", "calories": 600.0, "protein_g": 35.0, "carbs_g": 65.0, "fat_g": 18.0, "recipe_notes": "Whole grain oats rich in beta-glucan cooked with fresh salmon and straw mushrooms, providing sustained morning energy and heart-healthy omega-3 fats."}, {"meal_type": "lunch", "meal_label": "Lunch", "meal_name": "Lean Beef Pho with Brown Rice Noodles & Clear Vegetable Broth", "portion": "1 Large Bowl (550g)", "calories": 800.0, "protein_g": 50.0, "carbs_g": 90.0, "fat_g": 16.0, "recipe_notes": "Prepared with brown rice noodles, nutrient-dense clear vegetable broth, and tender lean beef slices low in saturated fat for optimal mid-day recovery."}, {"meal_type": "dinner", "meal_label": "Dinner", "meal_name": "Grilled Passion Fruit Salmon & Pan-Seared Asparagus", "portion": "1 Platter (450g)", "calories": 663.0, "protein_g": 52.0, "carbs_g": 30.0, "fat_g": 24.0, "recipe_notes": "Norwegian salmon fillet drizzled with a tangy passion fruit glaze, served alongside olive oil seared asparagus to deliver high protein and essential micronutrients."}, {"meal_type": "snack", "meal_label": "Snack", "meal_name": "Bitter Melon & King Oyster Mushroom Stir-Fry with Brown Rice", "portion": "1 Medium Plate (300g)", "calories": 337.0, "protein_g": 15.0, "carbs_g": 50.0, "fat_g": 8.0, "recipe_notes": "Utilizes bioactive compounds in bitter melon to support metabolic wellness and steady afternoon energy when paired with fiber-rich king oyster mushrooms."}]','["Fresh Salmon Fillets", "Lean Beef Slices", "Whole Grain Oats", "Brown Rice Noodles", "Brown Rice", "Straw Mushrooms", "King Oyster Mushrooms", "Bitter Melon", "Fresh Asparagus", "Vegetable Broth", "Passion Fruit", "Extra Virgin Olive Oil"]','2026-09-19 05:12:28.720795');
CREATE TABLE subscription_history (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	"plan" VARCHAR NOT NULL, 
	amount_vnd INTEGER NOT NULL, 
	payment_method VARCHAR, 
	stripe_session_id VARCHAR, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
INSERT INTO "subscription_history" VALUES(1,1,'pro',50000,'stripe_demo','demo_1788301212.906773','2026-09-02 05:20:12.908556');
INSERT INTO "subscription_history" VALUES(2,1,'plus',25000,'stripe_demo','demo_1788301671.007572','2026-09-02 05:27:51.009318');
INSERT INTO "subscription_history" VALUES(3,3,'plus',25000,'stripe_demo','demo_1788301809.521515','2026-09-02 05:30:09.523282');
INSERT INTO "subscription_history" VALUES(4,3,'plus',25000,'stripe','sess_1788301809.544012','2026-09-02 05:30:09.544367');
INSERT INTO "subscription_history" VALUES(5,3,'pro',50000,'stripe_demo','demo_1788301816.282676','2026-09-02 05:30:16.283080');
INSERT INTO "subscription_history" VALUES(6,3,'pro',50000,'stripe','sess_1788301816.304527','2026-09-02 05:30:16.304861');
INSERT INTO "subscription_history" VALUES(7,3,'plus',25000,'stripe_demo','demo_1788301831.343325','2026-09-02 05:30:31.343943');
INSERT INTO "subscription_history" VALUES(8,3,'plus',25000,'stripe','sess_1788301831.365847','2026-09-02 05:30:31.366292');
INSERT INTO "subscription_history" VALUES(9,3,'pro',50000,'stripe_demo','demo_1788301842.041233','2026-09-02 05:30:42.041643');
INSERT INTO "subscription_history" VALUES(10,3,'pro',50000,'stripe','sess_1788301842.066738','2026-09-02 05:30:42.067217');
INSERT INTO "subscription_history" VALUES(11,3,'plus',25000,'stripe_demo','demo_1788302281.765541','2026-09-02 05:38:01.767027');
INSERT INTO "subscription_history" VALUES(12,3,'plus',25000,'stripe','sess_1788302281.784535','2026-09-02 05:38:01.784881');
INSERT INTO "subscription_history" VALUES(13,3,'pro',50000,'stripe_demo','demo_1788302282.96828','2026-09-02 05:38:02.968824');
INSERT INTO "subscription_history" VALUES(14,3,'pro',50000,'stripe','sess_1788302282.990171','2026-09-02 05:38:02.990607');
INSERT INTO "subscription_history" VALUES(15,3,'plus',25000,'stripe_demo','demo_1788302283.94576','2026-09-02 05:38:03.946362');
INSERT INTO "subscription_history" VALUES(16,3,'plus',25000,'stripe','sess_1788302283.971343','2026-09-02 05:38:03.971738');
INSERT INTO "subscription_history" VALUES(17,3,'pro',50000,'stripe_demo','demo_1788302319.933813','2026-09-02 05:38:39.934305');
INSERT INTO "subscription_history" VALUES(18,3,'pro',50000,'stripe','sess_1788302319.957784','2026-09-02 05:38:39.958132');
INSERT INTO "subscription_history" VALUES(19,3,'plus',25000,'stripe_demo','demo_1788302322.694202','2026-09-02 05:38:42.694755');
INSERT INTO "subscription_history" VALUES(20,3,'plus',25000,'stripe','sess_1788302322.716043','2026-09-02 05:38:42.716392');
INSERT INTO "subscription_history" VALUES(21,2,'plus',25000,'stripe_demo','demo_1788302533.957154','2026-09-02 05:42:13.957743');
INSERT INTO "subscription_history" VALUES(22,2,'plus',25000,'stripe','sess_1788302533.983148','2026-09-02 05:42:13.983466');
INSERT INTO "subscription_history" VALUES(23,2,'pro',50000,'stripe_demo','demo_1788302540.693899','2026-09-02 05:42:20.694396');
INSERT INTO "subscription_history" VALUES(24,2,'pro',50000,'stripe','sess_1788302540.71877','2026-09-02 05:42:20.719215');
INSERT INTO "subscription_history" VALUES(25,2,'plus',25000,'stripe_demo','demo_1788302575.024408','2026-09-02 05:42:55.024810');
INSERT INTO "subscription_history" VALUES(26,2,'plus',25000,'stripe','sess_1788302575.048541','2026-09-02 05:42:55.048877');
INSERT INTO "subscription_history" VALUES(27,3,'pro',50000,'stripe_demo','demo_1788302584.788414','2026-09-02 05:43:04.789001');
INSERT INTO "subscription_history" VALUES(28,3,'pro',50000,'stripe','sess_1788302584.810877','2026-09-02 05:43:04.811214');
INSERT INTO "subscription_history" VALUES(29,1,'plus',25000,'stripe_demo','demo_1788302647.24492','2026-09-02 05:44:07.246645');
INSERT INTO "subscription_history" VALUES(30,3,'plus',25000,'stripe','sess_1788303104.840433','2026-09-02 05:51:44.843386');
INSERT INTO "subscription_history" VALUES(31,3,'pro',50000,'stripe','sess_1788303338.479525','2026-09-02 05:55:38.480040');
INSERT INTO "subscription_history" VALUES(32,3,'plus',25000,'stripe','sess_1788303386.996515','2026-09-02 05:56:26.997947');
INSERT INTO "subscription_history" VALUES(33,3,'pro',50000,'stripe','cs_test_a17uha2gr6JJOelJPK8NME9hTM03L9Y5XwpK1jZUTlhxWBrmRfA6EoION1','2026-09-02 06:33:33.294068');
INSERT INTO "subscription_history" VALUES(34,3,'plus',25000,'stripe','cs_test_a14Gp1zUrgObYad7c2On7hlroAeZP3AtsICfIfORm6BuKa1KWsxDNfOrSJ','2026-09-02 06:35:15.828041');
INSERT INTO "subscription_history" VALUES(35,3,'pro',50000,'stripe','cs_test_a1TOvP8D0CFDPz9LhRNJp3JgjBnjAAqNoILhAeSk4JNlyr0kD7W7cXE2u8','2026-09-05 06:57:37.342688');
CREATE TABLE user_profiles (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	height_cm FLOAT, 
	current_weight_kg FLOAT, 
	target_weight_kg FLOAT, 
	age INTEGER, 
	gender VARCHAR, 
	activity_level VARCHAR, 
	goal VARCHAR, 
	daily_calorie_target FLOAT, 
	bmi FLOAT, 
	tdee FLOAT, 
	body_shape VARCHAR, 
	dietary_preferences VARCHAR, avatar_url TEXT, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
INSERT INTO "user_profiles" VALUES(1,1,175.0,70.0,68.0,25,'male','active','maintain',2400.0,22.8,2400.0,'Fit',NULL,NULL);
INSERT INTO "user_profiles" VALUES(2,2,172.0,68.0,63.0,22,'male','moderate','weight_loss',1950.0,23.0,2350.0,'Average',NULL,NULL);
INSERT INTO "user_profiles" VALUES(3,3,179.5,62.5,63.0,25,'male','moderate','maintain',1500.0,19.4,2237.0,'Slim Fit / Lean','High blood fat, Stomach ache',NULL);
INSERT INTO "user_profiles" VALUES(4,4,172.0,60.0,70.0,30,'male','moderate','muscle_gain',2000.0,20.3,2104.0,'Slim Fit / Lean','Seafood allergy','https://res.cloudinary.com/rohl7aqf/image/upload/v1788334646/health_lens_ai/avatars/avatar_4_a5_xyzdyu.png');
CREATE TABLE users (
	id INTEGER NOT NULL, 
	email VARCHAR NOT NULL, 
	hashed_password VARCHAR, 
	full_name VARCHAR, 
	role VARCHAR, 
	auth_provider VARCHAR, 
	clerk_user_id VARCHAR, 
	"plan" VARCHAR, 
	stripe_customer_id VARCHAR, 
	stripe_subscription_id VARCHAR, 
	subscription_expires_at DATETIME, 
	subscription_status VARCHAR, 
	created_at DATETIME, avatar_url TEXT, 
	PRIMARY KEY (id)
);
INSERT INTO "users" VALUES(1,'admin@uit.edu.vn','5706b2e91627b01e570390307f8c50c48664df6543e15b22cc29f6aa57013dfc','System Administrator','admin','local',NULL,'plus',NULL,NULL,'2026-10-02 05:44:07.235023','active','2026-09-02 03:38:21.298723',NULL);
INSERT INTO "users" VALUES(2,'demouser@uit.edu.vn','14bfcd56eb51562d7ae7e10e5761c7d2194b34ecb5a22c6f29c262372c005274','Nguyen Trong Nhan','user','local',NULL,'pro',NULL,NULL,'2026-10-02 05:42:55.041321','active','2026-09-02 03:38:21.314632',NULL);
INSERT INTO "users" VALUES(3,'nhandev.work@gmail.com',NULL,'Nhan Nguyen','user','clerk','user_3Il4c3W5TwLqFxHR7SQMTE2THJP','pro',NULL,NULL,'2026-10-05 06:57:37.333767','active','2026-09-02 05:11:36.843999',NULL);
INSERT INTO "users" VALUES(4,'namngo7779@gmail.com',NULL,'Nam N','user','clerk','user_3IlFzDMYgK9h8MA3mG0rLuiC1QA','plus',NULL,NULL,NULL,'active','2026-09-02 06:45:09.178221','https://res.cloudinary.com/rohl7aqf/image/upload/v1788334646/health_lens_ai/avatars/avatar_4_a5_xyzdyu.png');
CREATE TABLE weight_logs (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	weight_kg FLOAT NOT NULL, 
	recorded_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
CREATE UNIQUE INDEX ix_users_clerk_user_id ON users (clerk_user_id);
CREATE INDEX ix_users_id ON users (id);
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE INDEX ix_food_database_id ON food_database (id);
CREATE UNIQUE INDEX ix_food_database_food_name ON food_database (food_name);
CREATE INDEX ix_user_profiles_id ON user_profiles (id);
CREATE INDEX ix_food_logs_id ON food_logs (id);
CREATE INDEX ix_weight_logs_id ON weight_logs (id);
CREATE INDEX ix_subscription_history_id ON subscription_history (id);
CREATE INDEX ix_ai_reports_id ON ai_reports (id);
CREATE INDEX ix_rag_meal_plans_id ON rag_meal_plans (id);
CREATE INDEX ix_rag_meal_plans_user_id ON rag_meal_plans (user_id);
COMMIT;
