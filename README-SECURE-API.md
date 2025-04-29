
# Secure Supabase API Proxy

This implementation provides a secure proxy layer between your frontend application and Supabase, preventing sensitive URLs, API keys, and error details from appearing in browser logs.

## Setup

1. **Environment Configuration**
   - Copy `.env.server.example` to `supabase/functions/.env.server`
   - Add your Supabase URL and service role key to the `.env.server` file
   - This file should NOT be committed to git (already ignored by .gitignore)

2. **Local Development**
   ```bash
   # Start Supabase Edge Functions locally
   supabase functions serve
   
   # In another terminal, start the Vite development server
   npm run dev
   ```
   
   The Vite server proxy configuration will automatically forward `/api/*` requests to the local Supabase Functions.

3. **Production Deployment**
   ```bash
   # Deploy edge functions
   supabase functions deploy secure-login
   supabase functions deploy secure-db
   supabase functions deploy secure-refresh
   
   # Set environment variables in Supabase dashboard
   supabase secrets set --env-file ./supabase/functions/.env.server
   ```

4. **Configure CORS**: In the Supabase dashboard, update CORS settings for your production domain.

5. **Enable RLS**: Remember to enable Row Level Security on all tables in your database.

## Security Features

- No Supabase URLs or API keys in frontend code
- All errors sanitized before sending to client
- Console logs removed in production builds
- Standardized error handling through Toast notifications
- Authentication tokens managed securely

## API Usage

```typescript
import { login, request, logout } from './utils/api';

// User authentication
await login(email, password);

// Data operations
const users = await request('GET', 'profiles');
const user = await request('GET', 'profiles/123');
await request('POST', 'contacts', { name: 'John Doe', email: 'john@example.com' });
await request('PATCH', 'contacts/456', { name: 'Jane Doe' });
await request('DELETE', 'contacts/789');

// Log out
logout();
```
