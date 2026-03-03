# Scripts

## Rimuovere i vecchi account MT (MetaAPI)

Dopo aver migrato a **solo mtapi.io**, gli account collegati al vecchio provider (MetaAPI) non funzionano più. Per pulire il database:

1. Apri **Supabase** → **SQL Editor**.
2. Apri il file `scripts/delete-old-mt-accounts.sql`.
3. Esegui lo script (l’istruzione attiva è la **Opzione 1**: elimina dove `provider = 'metaapi'`).
4. (Opzionale) Se vuoi eliminare anche account senza `broker_host` (vecchio flusso), commenta l’Opzione 1 e decommenta l’Opzione 2, poi riesegui.

**Nota:** Gli utenti dovranno ri-aggiungere l’account dalla pagina “Aggiungi account” inserendo **Host** e **Port** del broker (mtapi.io).

### Migrazione default provider

Dopo aver eseguito lo script di cancellazione (o in parallelo), applica la migrazione che imposta il default di `provider` a `mtapi`:

- Migrazione: `supabase/migrations/20250303100000_remove_metaapi_default_mtapi.sql`

Se usi la Supabase CLI: `supabase db push` oppure copia il contenuto della migrazione nel SQL Editor ed eseguilo.
