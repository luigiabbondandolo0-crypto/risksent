# Setup Telegram – variabili e come trovarle

## 1. Bot per gli alert (se non l’hai già)

1. Apri Telegram e cerca **@BotFather**.
2. Invia: `/newbot`
3. Nome del bot (es. **RiskSent Alerts**).
4. Username (deve finire in `bot`, es. **RiskSentAlertsBot**).
5. BotFather ti invia un **token** tipo: `7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
6. **Copia il token** e tienilo per la variabile `TELEGRAM_BOT_TOKEN`.

---

## 2. Variabili da impostare (Vercel / .env.local)

| Variabile | Dove si trova | Esempio |
|-----------|----------------|---------|
| `TELEGRAM_BOT_TOKEN` | BotFather dopo `/newbot` | `7123456789:AAHxxxx...` |
| `TELEGRAM_BOT_USERNAME` | Username del bot **senza** @ | `RiskSentAlertsBot` |
| `TELEGRAM_ALERT_CHANNEL_ID` | Chat ID del canale (vedi sotto) | `-1001234567890` |

---

## 3. Come trovare il Chat ID del canale (link tipo t.me/+xxx)

Il link **https://t.me/+vU1Xi6qDqV83ZWI0** è un invite: non contiene il chat_id. Il chat_id è un numero (negativo per canali/gruppi) che devi ricavare così.

### Passo A – Entrare nel canale
- Clicca sul link e **entra nel canale** (Join Channel).

### Passo B – Ottenere il Chat ID con @RawDataBot
1. In Telegram cerca **@RawDataBot**.
2. Avvia il bot (Start).
3. Torna nel **canale** RiskSent Alert Bot.
4. Se sei **admin del canale**:  
   - Aggiungi **@RawDataBot** al canale (Add members → cerca RawDataBot).  
   Se non sei admin, chiedi a chi gestisce il canale di aggiungerlo.
5. **Invia un messaggio qualsiasi** nel canale (es. “test”).
6. @RawDataBot ti risponde (in privato o nel canale) con un blocco di dati. Cerca la riga tipo:
   - **`"chat":{"id":-1001234567890`**  
   Il numero dopo `"id":` è il **Chat ID del canale** (sempre negativo, spesso inizia con `-100`).
7. **Copia quel numero** (es. `-1001234567890`) e usalo come valore di `TELEGRAM_ALERT_CHANNEL_ID`.

### Alternativa – @getidsbot
1. Cerca **@getidsbot**, avvialo.
2. **Inoltra un messaggio** dal canale a @getidsbot (Forward).
3. Il bot ti risponde con l’ID della chat da cui proviene il messaggio: quello è il chat_id del canale.

---

## 4. Far sì che il bot possa scrivere nel canale

1. Apri il **canale** (t.me/+vU1Xi6qDqV83ZWI0).
2. Vai in **Info / gestione canale** (nome del canale in alto).
3. **Administrators** → **Add Administrator**.
4. Cerca il **tuo bot** (es. @RiskSentAlertsBot) e aggiungilo.
5. Assicurati che abbia il permesso di **postare messaggi** (e se serve “Edit messages”).

Senza questo passo il bot non può inviare alert nel canale.

---

## 5. Riepilogo variabili in Vercel

1. Vercel → progetto RiskSent → **Settings** → **Environment Variables**.
2. Aggiungi (o controlla):

| Name | Value | Environment |
|------|--------|--------------|
| `TELEGRAM_BOT_TOKEN` | Token da BotFather | Production (e Preview se usi) |
| `TELEGRAM_BOT_USERNAME` | Es. `RiskSentAlertsBot` | Production (e Preview) |
| `TELEGRAM_ALERT_CHANNEL_ID` | Es. `-1001234567890` (chat_id canale) | Production (e Preview) |

3. **Save** e rifai un **redeploy** se l’app era già in esecuzione.

---

## 6. Webhook (per collegare la chat personale dei clienti)

Per il flusso “Collega Telegram” in app (link con /start):

1. Apri @BotFather.
2. Invia: `/setwebhook`
3. Quando richiesto, invia l’URL:  
   **`https://risksent.com/api/telegram-webhook`**  
   (sostituisci il dominio se il tuo sito è diverso.)

Dopo questo, quando un utente clicca “Collega ora” e invia /start al bot, RiskSent può associare la sua chat e inviargli gli alert in privato. Il canale (con `TELEGRAM_ALERT_CHANNEL_ID`) resta per gli alert aggregati al gestore.
