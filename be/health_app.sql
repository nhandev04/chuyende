BEGIN TRANSACTION;
CREATE TABLE ai_reports (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	food_log_id INTEGER, 
	original_prediction VARCHAR NOT NULL, 
	user_correction VARCHAR NOT NULL, 
	image_url VARCHAR, 
	status VARCHAR, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(food_log_id) REFERENCES food_logs (id)
);
INSERT INTO "ai_reports" VALUES(1,1,NULL,'Cilantro mint','fruit','https://res.cloudinary.com/rohl7aqf/image/upload/v1789802387/health_lens_ai/food_scans/scan_banane-apfel-was-gesuender_f8wcpr.jpg','pending','2026-09-19 07:33:43.540972');
INSERT INTO "ai_reports" VALUES(2,3,NULL,'Juice','smoothie','https://res.cloudinary.com/rohl7aqf/image/upload/v1789802367/health_lens_ai/food_scans/scan_beef_noodle_fq8fzz.webp','resolved','2026-09-22 15:32:41.775789');
INSERT INTO "ai_reports" VALUES(3,1,NULL,'Cilantro mint','fruit','https://res.cloudinary.com/rohl7aqf/image/upload/v1789802387/health_lens_ai/food_scans/scan_banane-apfel-was-gesuender_f8wcpr.jpg','dismissed','2026-09-22 15:49:43.536989');
INSERT INTO "ai_reports" VALUES(4,1,NULL,'Cilantro mint','Fresh Fruit Plate','https://res.cloudinary.com/rohl7aqf/image/upload/v1790093117/health_lens_ai/food_scans/scan_test_banana_nrfjdg.jpg','resolved','2026-09-22 16:05:34.069639');
INSERT INTO "ai_reports" VALUES(5,1,NULL,'Coffee','Tea','https://res.cloudinary.com/rohl7aqf/image/upload/v1790093733/health_lens_ai/food_scans/scan_test_meal_pckj5c.jpg','pending','2026-09-22 16:15:38.060082');
INSERT INTO "ai_reports" VALUES(7,3,NULL,'Biscuit','sponge cake','https://res.cloudinary.com/rohl7aqf/image/upload/v1790093959/health_lens_ai/food_scans/scan_bb52b1196b_i37efb.webp','pending','2026-09-22 16:19:52.483996');
INSERT INTO "ai_reports" VALUES(8,3,NULL,'Cilantro mint','banana','https://res.cloudinary.com/rohl7aqf/image/upload/v1790094957/health_lens_ai/food_scans/scan_51e0bdbe8e_qjdthv.jpg','resolved','2026-09-22 16:36:06.677230');
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
INSERT INTO "food_database" VALUES(8,'smoothie','AI User Feedback',150.0,10.0,18.0,5.0,NULL);
INSERT INTO "food_database" VALUES(9,'banana','AI User Feedback',150.0,10.0,18.0,5.0,NULL);
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
INSERT INTO "food_logs" VALUES(1,4,'breakfast','Organic Omelet Roll with King Oyster Mushrooms & Asparagus',350.0,280.0,20.0,10.0,12.0,NULL,0.95,'2026-09-19 06:57:08.584810');
INSERT INTO "food_logs" VALUES(2,4,'lunch','Steak',400.0,480.0,26.5,58.0,14.2,'https://res.cloudinary.com/rohl7aqf/image/upload/v1789802367/health_lens_ai/food_scans/scan_beef_noodle_fq8fzz.webp',0.95,'2026-09-19 07:19:33.954825');
INSERT INTO "food_logs" VALUES(3,4,'lunch','Cilantro mint',400.0,480.0,26.5,58.0,14.2,'https://res.cloudinary.com/rohl7aqf/image/upload/v1789802387/health_lens_ai/food_scans/scan_banane-apfel-was-gesuender_f8wcpr.jpg',0.95,'2026-09-19 07:19:50.623952');
INSERT INTO "food_logs" VALUES(4,1,'lunch','Bread',400.0,480.0,26.5,58.0,14.2,'https://res.cloudinary.com/rohl7aqf/image/upload/v1789802880/health_lens_ai/food_scans/scan_bread_3_qrbdwi.jpg',0.95,'2026-09-19 07:28:06.332204');
INSERT INTO "food_logs" VALUES(5,1,'lunch','Carrot',400.0,480.0,26.5,58.0,14.2,'https://res.cloudinary.com/rohl7aqf/image/upload/v1789802901/health_lens_ai/food_scans/scan_carrot2_eunotj.jpg',0.95,'2026-09-19 07:28:25.816786');
INSERT INTO "food_logs" VALUES(6,3,'breakfast','Vegetarian Bun Bo Hue with Tofu & King Oyster Mushrooms',350.0,462.0,23.7,68.7,7.1,NULL,0.95,'2026-09-22 15:27:12.989730');
INSERT INTO "food_logs" VALUES(7,3,'lunch','Bread',400.0,480.0,26.5,58.0,14.2,'https://res.cloudinary.com/rohl7aqf/image/upload/v1790090985/health_lens_ai/food_scans/scan_bread_3_yap5tk.jpg',0.95,'2026-09-22 15:30:21.664790');
INSERT INTO "food_logs" VALUES(9,1,'lunch','Cilantro mint',400.0,480.0,26.5,58.0,14.2,'https://res.cloudinary.com/rohl7aqf/image/upload/v1790092165/health_lens_ai/food_scans/scan_banane-apfel-was-gesuender_nf51iu.jpg',0.95,'2026-09-22 15:49:50.248450');
INSERT INTO "food_logs" VALUES(10,3,'lunch','Ice cream',400.0,480.0,26.5,58.0,14.2,'https://res.cloudinary.com/rohl7aqf/image/upload/v1790093890/health_lens_ai/food_scans/scan_09c2c35052_xd8lsr.jpg',0.95,'2026-09-22 16:18:15.381979');
INSERT INTO "food_logs" VALUES(11,3,'lunch','Strawberry',400.0,480.0,26.5,58.0,14.2,'https://res.cloudinary.com/rohl7aqf/image/upload/v1790094924/health_lens_ai/food_scans/scan_b65409c834_wwyxbd.jpg',0.95,'2026-09-22 16:35:31.900679');
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
INSERT INTO "rag_meal_plans" VALUES(1,4,'pro',2000.0,'✨ Personalized AI Smart Weight Loss Meal Plan','As your Clinical Medical Nutrition Specialist, I have tailored this 2000 kcal weight-loss meal plan to align with your TDEE of 2210 kcal, creating an optimal caloric deficit for sustainable fat loss. Since you have no special dietary restrictions or allergies, we have incorporated a balanced macronutrient distribution utilizing high-fiber complex carbohydrates, lean poultry, organic eggs, and antioxidant-rich superfoods. Ensure adequate hydration throughout the day and pair this nutrition plan with consistent physical activity to maximize metabolic health and body composition goals.','[{"meal_type": "breakfast", "meal_label": "Breakfast", "meal_name": "Organic Omelet Roll with King Oyster Mushrooms & Asparagus", "portion": "1 Large Serving (280g)", "calories": 280.0, "protein_g": 20.0, "carbs_g": 10.0, "fat_g": 12.0, "recipe_notes": "Organic eggs pan-seared and rolled with sliced mushrooms and fresh asparagus, providing a nutrient-dense, low-carb start to your morning metabolism."}, {"meal_type": "lunch", "meal_label": "Lunch", "meal_name": "Pan-Seared Teriyaki Chicken Breast with Brown Rice & Broccoli", "portion": "1 Generous Plate (450g)", "calories": 720.0, "protein_g": 55.0, "carbs_g": 75.0, "fat_g": 10.0, "recipe_notes": "Teriyaki marinated chicken breast served with steamed brown rice and fresh broccoli to support lean muscle preservation and sustained energy levels."}, {"meal_type": "dinner", "meal_label": "Dinner", "meal_name": "Steamed Pumpkin, Chickpea & Spinach Coconut Curry Broth", "portion": "1 Large Bowl (500g)", "calories": 660.0, "protein_g": 28.0, "carbs_g": 85.0, "fat_g": 14.0, "recipe_notes": "High fiber chickpeas and fresh pumpkin simmered in light coconut broth with spinach, promoting satiety and supporting digestive health before bedtime."}, {"meal_type": "snack", "meal_label": "Snack", "meal_name": "Chia Seed & Unsweetened Soy Milk Pudding with Wild Blueberries", "portion": "1 Bowl (300g)", "calories": 340.0, "protein_g": 18.0, "carbs_g": 30.0, "fat_g": 11.0, "recipe_notes": "Soluble fiber and antioxidant-rich chia pudding ideal for stabilizing blood sugar levels and curbing afternoon cravings."}]','["Organic eggs", "King oyster mushrooms", "Fresh asparagus", "Chicken breast", "Brown rice", "Fresh broccoli", "Teriyaki sauce (low sodium)", "Fresh pumpkin", "Canned chickpeas", "Fresh spinach", "Light coconut milk", "Chia seeds", "Unsweetened soy milk", "Wild blueberries"]','2026-09-19 06:57:06.545650');
INSERT INTO "rag_meal_plans" VALUES(2,3,'pro',1850.0,'✨ Personalized AI Smart Meal Plan','Clinical Protocol for Hyperlipidemia: Prioritize high-viscosity soluble fibers (oats, legumes) and marine Omega-3 fatty acids (EPA/DHA) to downregulate hepatic VLDL synthesis. Strictly avoid trans fats and saturated animal lipids.','[{"meal_type": "breakfast", "meal_label": "Breakfast", "meal_name": "Vegetarian Bun Bo Hue with Tofu & King Oyster Mushrooms", "portion": "1 Serving (~379g)", "calories": 462.0, "protein_g": 23.7, "carbs_g": 68.7, "fat_g": 7.1, "recipe_notes": "Naturally sweetened lemongrass broth with air-fried tofu and fresh mushrooms."}, {"meal_type": "lunch", "meal_label": "Lunch", "meal_name": "Shredded Chicken, Lotus Seed & Tofu Soup", "portion": "1 Serving (~648g)", "calories": 648.0, "protein_g": 60.8, "carbs_g": 50.6, "fat_g": 10.1, "recipe_notes": "Cleansing lotus seed and tofu broth with lean shredded chicken breast."}, {"meal_type": "dinner", "meal_label": "Dinner", "meal_name": "Bitter Melon & King Oyster Mushroom Stir-Fry with Brown Rice", "portion": "1 Serving (~507g)", "calories": 555.0, "protein_g": 23.8, "carbs_g": 79.3, "fat_g": 9.5, "recipe_notes": "Bitter melon is clinically known for natural bioactive compounds supporting insulin sensitivity."}, {"meal_type": "snack", "meal_label": "Snack", "meal_name": "Lean Beef Pho with Brown Rice Noodles & Clear Vegetable Broth", "portion": "1 Serving (~132g)", "calories": 185.0, "protein_g": 12.3, "carbs_g": 22.6, "fat_g": 3.3, "recipe_notes": "Made with brown rice noodles, clear vegetable broth, and thin lean beef slices low in saturated fat."}]','["Fresh Norwegian Salmon Fillets 400g", "Skinless Chicken Breast 500g", "Organic Steel-Cut Oats 500g", "Fresh Asparagus & Green Beans 350g", "Extra Virgin Olive Oil 250ml", "Ripe Hass Avocados (2 pcs)", "Greek Yogurt 0% Fat 400g"]','2026-09-22 15:17:34.492181');
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
INSERT INTO "subscription_history" VALUES(1,4,'pro',50000,'stripe','cs_test_a1iJrntn7y4uGmAWUV8599n7A8hCTQeAOBWJs1Abu85E9PSXlmMvfYmSi9','2026-09-19 06:56:35.632706');
INSERT INTO "subscription_history" VALUES(2,3,'pro',50000,'stripe','cs_test_a1PkSTlcwykJqji1Nf0JQpb6ShKCx8DNEZqjuaeel9GRTU7XQnchcIhlff','2026-09-22 15:03:55.956590');
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
	dietary_preferences VARCHAR, 
	avatar_url VARCHAR, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
INSERT INTO "user_profiles" VALUES(1,1,175.0,70.0,68.0,25,'male','active','maintain',2400.0,22.8,2400.0,'Fit',NULL,NULL);
INSERT INTO "user_profiles" VALUES(2,2,172.0,68.0,63.0,22,'male','moderate','weight_loss',1950.0,23.0,2350.0,'Average',NULL,NULL);
INSERT INTO "user_profiles" VALUES(3,3,179.5,62.5,65.0,26,'male','light','weight_loss',1830.0,19.4,2230.0,'Slim Fit / Lean','High blood fat, Seafood allergy',NULL);
INSERT INTO "user_profiles" VALUES(4,4,170.0,65.0,60.0,22,'male','moderate','weight_loss',2000.0,22.5,2210.0,'Ideal Mesomorph',NULL,NULL);
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
	avatar_url VARCHAR, 
	created_at DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO "users" VALUES(1,'admin@uit.edu.vn','5706b2e91627b01e570390307f8c50c48664df6543e15b22cc29f6aa57013dfc','System Administrator','admin','local',NULL,'pro',NULL,NULL,NULL,'active',NULL,'2026-09-19 06:17:12.895072');
INSERT INTO "users" VALUES(2,'demouser@uit.edu.vn','14bfcd56eb51562d7ae7e10e5761c7d2194b34ecb5a22c6f29c262372c005274','Nguyen Trong Nhan','user','local',NULL,'standard',NULL,NULL,NULL,'active',NULL,'2026-09-19 06:17:13.627605');
INSERT INTO "users" VALUES(3,'nhandev.work@gmail.com',NULL,'Nhan Nguyen','user','clerk','user_3Il4c3W5TwLqFxHR7SQMTE2THJP','pro',NULL,NULL,'2026-10-22 15:03:55.868976','active',NULL,'2026-09-19 06:55:07.431741');
INSERT INTO "users" VALUES(4,'namngo7779@gmail.com',NULL,'Nam N','user','clerk','user_3IlFzDMYgK9h8MA3mG0rLuiC1QA','pro',NULL,NULL,'2026-10-19 06:56:35.555365','active',NULL,'2026-09-19 06:55:32.422292');
CREATE TABLE weight_logs (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	weight_kg FLOAT NOT NULL, 
	recorded_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
CREATE INDEX ix_users_id ON users (id);
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE UNIQUE INDEX ix_users_clerk_user_id ON users (clerk_user_id);
CREATE INDEX ix_food_database_id ON food_database (id);
CREATE UNIQUE INDEX ix_food_database_food_name ON food_database (food_name);
CREATE INDEX ix_user_profiles_id ON user_profiles (id);
CREATE INDEX ix_food_logs_id ON food_logs (id);
CREATE INDEX ix_weight_logs_id ON weight_logs (id);
CREATE INDEX ix_subscription_history_id ON subscription_history (id);
CREATE INDEX ix_rag_meal_plans_user_id ON rag_meal_plans (user_id);
CREATE INDEX ix_rag_meal_plans_id ON rag_meal_plans (id);
CREATE INDEX ix_ai_reports_id ON ai_reports (id);
COMMIT;
