# ⚡ Flooring CRM — Complete Setup Guide
**For: Andrew & Tina · Legacy Hardwoods + GR Hardwood Refinishing**

---

## What You're Setting Up

| Piece | What It Does | Cost |
|---|---|---|
| **Supabase** | Stores all lead data in a database | FREE |
| **Make.com** | Automatically pulls leads from your Formspree forms | FREE (1,000/mo) |
| **GitHub Pages** | Hosts the CRM so you can access it from any phone/browser | FREE |
| **Formspree** | Already handles your contact forms + sends email notifications | Already set up |

---

## STEP 1 — Create Your Supabase Database

Supabase is your database. It stores every lead and remembers everything.

1. Go to **https://supabase.com** and click **Start your project**
2. Sign up with Google or email (free)
3. Click **New Project**
   - Name it: `flooring-crm`
   - Set a strong database password (save this somewhere!)
   - Choose region: **US East (N. Virginia)**
4. Wait about 2 minutes for it to set up

### Create the Leads Table

5. In the left sidebar, click **SQL Editor**
6. Click **New Query**
7. Copy and paste ALL of this SQL, then click **Run**:

```sql
-- Create the leads table
CREATE TABLE leads (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company         TEXT NOT NULL CHECK (company IN ('legacy', 'grhfr')),
  name            TEXT,
  email           TEXT,
  phone           TEXT,
  status          TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  response_method TEXT,
  notes           TEXT,
  form_data       JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow all access with your API key (this is an internal tool)
CREATE POLICY "Allow all operations" ON leads FOR ALL USING (true) WITH CHECK (true);

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Realtime so leads pop in automatically
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
```

8. You should see: **"Success. No rows returned"** ✅

### Get Your Credentials

9. In the left sidebar, click ⚙️ **Settings → API**
10. Copy and save these two things:
    - **Project URL** — looks like: `https://abcdefgh.supabase.co`
    - **anon public** key — a very long code starting with `eyJ`

> 🔐 **Keep these safe.** They go into the CRM settings screen.

---

## STEP 2 — Deploy the CRM to GitHub Pages

This puts your CRM online so you can open it from any phone.

1. Go to **https://github.com** and sign in (or create a free account)
2. Click the **+** button → **New repository**
   - Name: `flooring-crm`
   - Set to **Public**
   - Click **Create repository**
3. On the next screen, click **uploading an existing file**
4. Drag and drop these 3 files from the folder you received:
   - `index.html`
   - `manifest.json`
   - `sw.js`
5. Click **Commit changes**
6. Now click **Settings** (tab at the top of the repository)
7. In the left menu, click **Pages**
8. Under "Branch," select **main** and click **Save**
9. Wait 1-2 minutes, then your CRM will be live at:
   **`https://YOUR-GITHUB-USERNAME.github.io/flooring-crm`**

> 📱 **Bookmark this link** — this is your CRM's permanent address!

---

## STEP 3 — First Login & Connect to Database

1. Open your CRM link in any browser
2. You'll see the **Welcome! Let's connect.** setup screen
3. Paste in your:
   - **Supabase Project URL** (from Step 1)
   - **Supabase Anon Key** (from Step 1)
4. Tap **Connect & Get Started**
5. You should see the dashboard! ✅

> 💡 You only need to do this once per device/browser. It remembers your settings.

---

## STEP 4 — Add the CRM to Your Phone's Home Screen

This makes it feel like a real app with its own icon.

### iPhone (Safari ONLY — must use Safari, not Chrome)
1. Open your CRM link in **Safari**
2. Tap the **Share button** (box with arrow at the bottom)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it **"Floor CRM"**
5. Tap **Add**
6. It now appears on your home screen like a regular app! 📱

### Android (Chrome)
1. Open your CRM link in **Chrome**
2. Tap the **three dots** menu (top right)
3. Tap **"Add to Home screen"** or **"Install app"**
4. Tap **Add**

---

## STEP 5 — Connect Your Forms (Automatic Lead Import)

This is how Formspree leads automatically appear in the CRM.

### Use Make.com (Free — 1,000 operations/month)

1. Go to **https://make.com** and create a free account

2. Click **Create a new scenario**

3. Click the **+** (plus) to add a module

4. Search for **"Webhooks"** and select **Custom webhook**
   - Click **Add**
   - Name it: `Legacy Formspree` (or GRHFR)
   - Click **Save**
   - Copy the **webhook URL** it gives you

5. In your **Formspree dashboard** (formspree.io):
   - Open your Legacy Hardwoods form
   - Go to **Integrations → Webhooks**
   - Paste in the Make.com webhook URL
   - Save

6. Back in Make.com, add a second module: **HTTP → Make a request**
   - **URL:** `https://YOUR-PROJECT.supabase.co/rest/v1/leads`
   - **Method:** POST
   - **Headers:**
     - `apikey` → your Supabase anon key
     - `Authorization` → `Bearer YOUR-SUPABASE-ANON-KEY`
     - `Content-Type` → `application/json`
     - `Prefer` → `return=minimal`
   - **Body type:** Raw
   - **Content type:** JSON (application/json)
   - **Request content:**
   ```json
   {
     "company": "legacy",
     "name": "{{1.name}}",
     "email": "{{1.email}}",
     "phone": "{{1.phone}}",
     "form_data": {{1}}
   }
   ```

7. Click **Save** and turn the scenario **ON** (toggle at the bottom)

8. **Repeat steps 2–7 for your GRHFR form**, changing:
   - `"company": "legacy"` → `"company": "grhfr"`
   - The webhook in GRHFR's Formspree form

> ✅ **Now every form submission automatically appears in your CRM!**

### Alternative: Test with a Manual Lead

Don't want to set up Make.com right now? No problem.
- In the CRM, go to **Leads** → tap **+ Add Lead Manually**
- Fill in the form and save
- The lead appears instantly

---

## STEP 6 — Email Notifications (You Already Have These!)

Formspree already sends Andrew an email every time someone fills out a form. ✅

If you want a **second email** with a different format, you can add one in Make.com:
- After the "Make HTTP Request" step, add an **Email** module
- Configure it to email Andrew whenever a new lead comes in

---

## STEP 7 — Phone Push Notifications (Optional, Advanced)

If you want a **pop-up notification** on the phone (not just email):

1. Go to **https://onesignal.com** → Create a free account
2. Create a new app → choose **Web Push**
3. Set your site URL to your GitHub Pages address
4. Follow their setup guide to get your **App ID**
5. Add this code just before `</body>` in `index.html`:

```html
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: "YOUR-ONESIGNAL-APP-ID",
    });
  });
</script>
```

6. Then create a Make.com step to send a OneSignal notification when a new lead arrives

---

## How Andrew Uses the CRM Every Day

### Check for new leads:
1. Open the **Floor CRM** icon on your phone
2. The **big number** on the home screen = how many new leads need a response
3. Tap the banner to see them

### Respond to a lead:
1. Tap the lead's name
2. Call them, text them, or email them (their phone number is tappable!)
3. Come back to the CRM and tap **"📞 Mark as Contacted"**
4. Pick how you reached out (Call / Text / Email / Voicemail)
5. Add any notes if you want

### Switch between companies:
- Tap **LEGACY** or **GRHFR** in the top-right corner
- The whole app changes color — brown for Legacy, blue for GRHFR
- Everything you see is specific to that company

### Mark a job as won:
- Open the lead → tap **"✅ Mark Closed / Job Won"**

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Could not load leads" | Check your Supabase URL and key in Settings |
| Leads not coming in automatically | Check your Make.com scenario is turned ON |
| Can't add to home screen | Must use Safari on iPhone, Chrome on Android |
| Real-time not working | Make sure you ran the Realtime SQL command in Step 1 |
| Form data not showing | Check the field names in Make.com match your Formspree form |

---

## Your Important Links & Credentials

Save this somewhere safe! (Or write it down and keep it in the office.)

| Item | Value |
|---|---|
| CRM URL | `https://YOUR-USERNAME.github.io/flooring-crm` |
| Supabase Dashboard | `https://app.supabase.com` |
| Supabase Project URL | *(fill in from Step 1)* |
| Supabase Anon Key | *(fill in from Step 1)* |
| Make.com Dashboard | `https://make.com` |
| Formspree Dashboard | `https://formspree.io` |

---

*Built for Andrew & Tina — Legacy Hardwoods & GR Hardwood Refinishing*
