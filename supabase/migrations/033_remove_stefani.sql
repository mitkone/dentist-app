-- Премахва Стефани (bbystefixo@gmail.com) от платформата — вече не работи в клиниката.

DELETE FROM auth.users
WHERE lower(email) = 'bbystefixo@gmail.com';

DELETE FROM public.profiles
WHERE lower(email) = 'bbystefixo@gmail.com';
