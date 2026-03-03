-- Replica identity full: needed so DELETE/UPDATE Realtime events include old record (dentist_id)
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
