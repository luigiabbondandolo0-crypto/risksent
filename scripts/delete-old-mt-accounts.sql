-- =============================================================================
-- Script: rimuovere i vecchi account MT collegati al vecchio provider (MetaAPI)
-- =============================================================================
-- Esegui questo script nel Supabase SQL Editor DOPO aver migrato il codice
-- a mtapi-only e PRIMA (o dopo) di aver applicato la migrazione
-- 20250303100000_remove_metaapi_default_mtapi.sql.
--
-- Cosa fa:
--   Elimina da trading_account le righe che sono ancora collegate al vecchio
--   provider (provider = 'metaapi') oppure che non hanno broker_host/broker_port
--   (account aggiunti con il flusso MetaAPI che non hanno i campi mtapi).
--
-- ATTENZIONE: Gli utenti dovranno ri-aggiungere l'account dalla pagina
-- "Aggiungi account" con Host + Port (mtapi).
-- =============================================================================

-- Opzione 1: elimina solo gli account con provider = 'metaapi'
DELETE FROM public.trading_account
WHERE provider = 'metaapi';

-- Opzione 2 (alternativa): elimina gli account che non hanno broker_host
-- (cioè aggiunti con il vecchio flusso senza host/port)
-- DELETE FROM public.trading_account
-- WHERE broker_host IS NULL OR broker_host = '';

-- Verifica: conta quanti account restano
-- SELECT count(*) FROM public.trading_account;
