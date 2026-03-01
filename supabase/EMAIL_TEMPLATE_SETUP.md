# Email Confirmation Template Setup

Questo file contiene il template HTML per l'email di conferma di Supabase.

## Come configurare in Supabase

1. Vai su **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Seleziona **Confirm signup** (o **Magic Link** se usi magic links)
3. Copia il contenuto di `email-confirmation-template.html`
4. Incolla nel campo del template
5. Configura le variabili:
   - `{{ .SiteURL }}` - URL del tuo sito (es. `https://risksent.com`)
   - `{{ .ConfirmationURL }}` - URL di conferma generato automaticamente da Supabase
   - `{{ .Email }}` - Email dell'utente

## Variabili disponibili in Supabase

- `{{ .SiteURL }}` - URL del sito configurato in Supabase
- `{{ .ConfirmationURL }}` - Link di conferma completo
- `{{ .Email }}` - Email dell'utente
- `{{ .Token }}` - Token di conferma (se necessario)
- `{{ .TokenHash }}` - Hash del token (se necessario)

## Configurazione URL di redirect

In **Supabase Dashboard** → **Authentication** → **URL Configuration**:

- **Site URL**: `https://risksent.com` (o il tuo dominio)
- **Redirect URLs**: Aggiungi:
  - `https://risksent.com/**`
  - `http://localhost:3000/**` (per sviluppo locale)

## Note

- Il template usa variabili Go template (sintassi `{{ .Variable }}`)
- Assicurati che il logo sia accessibile pubblicamente su `/logo.png`
- Il template è responsive e funziona su mobile
