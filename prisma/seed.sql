-- ترقية المستخدم إلى أدمن
UPDATE "User" SET role = 'ADMIN' WHERE email = 'mtzallqmy@gmail.com';

-- إذا لم يكن موجوداً، قم بإنشائه (ملاحظة: يجب تشفير كلمة المرور مسبقاً)
-- INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") 
-- VALUES ('admin_id', 'mtzallqmy@gmail.com', 'hashed_password', 'ADMIN', NOW(), NOW())
-- ON CONFLICT (email) DO UPDATE SET role = 'ADMIN';
