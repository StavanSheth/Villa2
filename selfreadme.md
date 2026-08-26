# How to Manually Start the Servers

**Project Directory:** `c:\Projects\Mavon\Clients\reposit-solar\discovery`

To start the development servers manually from the terminal, ensure that Docker is already running, then navigate to the project directory and execute the following command:

```bash
cd c:\Projects\Mavon\Clients\reposit-solar\discovery
pnpm dev
```

If you haven't installed the dependencies yet, you should run `pnpm install` first.

### Localhost Links

Once the servers are running, they are available at the following URLs:

- **Web / Main**: [http://localhost:3000](http://localhost:3000)
- **Booking App**: [http://localhost:3001](http://localhost:3001)
- **Staff Portal**: [http://localhost:3003](http://localhost:3003)
- **Owner Portal**: [http://localhost:3004](http://localhost:3004)
- **Customer Portal**: [http://localhost:3005](http://localhost:3005)
- **Landing Page**: [http://localhost:5173](http://localhost:5173)
- **API (Wrangler)**: [http://127.0.0.1:8787](http://127.0.0.1:8787)

### Other Useful Commands (run in project directory)

- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Test**: `pnpm test`
- **Database Studio / Generation**: `pnpm db:generate`, `pnpm db:migrate`
