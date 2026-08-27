# Supabase setup for Dead Signal

Yes — Supabase works great for this. The game already supports it.

## Steps

1. Create a free project at https://supabase.com
2. **Authentication → Providers → Email**: turn **OFF** "Confirm email" (accounts use a synthetic email from the username).
3. **SQL Editor**: open `supabase-leaderboard.sql` from this repo, paste, and run it.
4. **Project Settings → API**: copy **Project URL** and the **anon public** key.
5. Edit `js/supabase-config.js`:

```js
window.DS_SUPABASE = {
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_ANON_KEY"
};
```

6. Commit/push. After that, Register/Login and the leaderboard are **global**.

If `url` / `anonKey` are left empty, the game keeps using **local** accounts on the device only.
