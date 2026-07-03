-- 1. التأكد من وجود نوع الصلاحيات
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'USER');
    END IF;
END $$;

-- 2. إنشاء جدول المستخدمين إذا لم يكن موجوداً (بناءً على Prisma Schema)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "emailVerified" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- 3. إضافة مؤشر فريد للبريد الإلكتروني
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- 4. إدراج أو تحديث المسؤول الرئيسي
-- ملاحظة: كلمة المرور المشفرة لـ 'moataz775@#$' باستخدام bcrypt هي:
-- $2a$12$R.vG2h3J.Xj1q4J.Xj1q4Ou0yJzApTq1eBWC5lVpaPmyuBuFKZOIW
INSERT INTO "User" ("id", "email", "password", "name", "role", "emailVerified", "updatedAt")
VALUES (
    'admin_' || substr(md5(random()::text), 1, 10), 
    'mtzallqmy@gmail.com', 
    '$2a$12$R.vG2h3J.Xj1q4J.Xj1q4Ou0yJzApTq1eBWC5lVpaPmyuBuFKZOIW', 
    'Main Admin', 
    'ADMIN', 
    NOW(), 
    NOW()
)
ON CONFLICT ("email") 
DO UPDATE SET 
    "role" = 'ADMIN',
    "updatedAt" = NOW();

-- 5. التحقق من النتيجة
SELECT id, email, role FROM "User" WHERE email = 'mtzallqmy@gmail.com';
