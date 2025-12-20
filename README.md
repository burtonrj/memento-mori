# Memento Mori

A productivity app designed to help you focus on what truly matters by limiting multitasking and prioritising your primary focus.

## Overview

This app is built around the philosophy that **multitasking is the enemy of meaningful progress**. Instead of juggling endless tasks, Memento Mori helps you define a single primary focus and structure your week around it.

To keep things grounded, the app features a **Memento Mori** death clock—a reminder of the finite time you have left. This isn't meant to be morbid, but motivating: when you see your remaining hours ticking away, you naturally want to spend them on what matters most. We balance this existential nudge with **Positive Affirmations** that you can customize.

### Core Concepts

- **One Primary Focus**: Define your primary focus (e.g., "Your Business", "Writing", "Music"). This is the one thing you should be working toward.
- **Limited Objectives**: 
  - 3 long-term objectives (clear monthly/quarterly/yearly)
  - 3 weekly objectives (clear weekly)
  - 2 weekly necessity objectives (clear weekly)
- **Necessity Blocks**: Four categories for life's required activities: Work, Chores, Exercise, and Relaxation (customisable names)
- **Time Blocking**: Drag-and-drop colored bricks onto a weekly schedule to visualise where your time goes
- **Fresh Slate Philosophy**: Objectives reset weekly/monthly, preventing backlog buildup and forcing prioritisation

## Features

- 🎯 **Focus-first design** - One primary focus with supporting objectives
- ⏰ **Death clock** - Real-time countdown of hours remaining in your expected lifespan
- 📝 **Editable affirmations** - Customise motivational messages
- 🧱 **Block Bank** - Adjustable brick counts for each time category
- 📅 **Weekly schedule** - Drag bricks to plan your week visually
- 🔒 **Schedule locking** - Lock your schedule to prevent accidental changes

## Setup and Deployment

This application is designed to be deployed on **Vercel** with a **Turso** (libSQL) database.

### Prerequisites

1.  A [Vercel](https://vercel.com/) account.
2.  A [Turso](https://turso.tech/) account and database.

### Deployment Steps

1.  **Setup Vercel Project:**
    *   Import this repository into a new Vercel project.
    *   Select SvelteKit as the framework (Vercel usually detects this automatically).

2.  **Setup Turso Database:**
    *   Create a new database in Turso.
    *   Get the `DATABASE_URL` and `DATABASE_AUTH_TOKEN`.
    *   The database will be automatically seeded on first run.

3.  **Create Password Hash:**
    *   The app uses a simple single-user authentication system. You need to generate a bcrypt hash for your desired password.
    *   You can do this via a node script:
        ```bash
        node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD_HERE', 10))"
        ```

4.  **Environment Variables:**
    *   In your Vercel project settings, add the following environment variables:
        *   `DATABASE_URL`: Your Turso database URL (e.g., `libsql://...`).
        *   `DATABASE_AUTH_TOKEN`: Your Turso authentication token.
        *   `ADMIN_PASSWORD_HASH`: The bcrypt hash you generated in step 3.
        *   `AUTH_SECRET`: A random string used for signing session cookies (e.g., generate with `openssl rand -base64 32`).

5.  **Deploy:**
    *   Trigger a deployment in Vercel. Once finished, your app should be live and protected by the login screen.

### Database Reset

To reset the database and reseed with default data:

```bash
export $(grep -v '^#' .env | xargs) && npx tsx src/lib/server/db/reset.ts
```

Then restart the dev server to trigger seeding.

## Customization

### Default Data

Edit `static/default-data.json` to customize:
- Initial affirmations
- Default age for death clock calculation
- Primary focus label
- Necessity block names and colors
- Starting objectives

### Necessity Blocks

The four necessity blocks can be renamed in the app under Block Bank → "Customize Block Names". Default blocks are:
- **Work** (blue) - Employment, contracting, etc.
- **Chores** (gray) - Household tasks, errands
- **Exercise** (green) - Physical activity, health
- **Relaxation** (pink) - Rest, hobbies, social time

## Limitations

*   **Single User:** The authentication system is designed for personal use by a single user.
*   **Intentionally Limited:** The restricted number of objectives is a feature, not a bug—it forces prioritization.
*   **Fresh Slate Philosophy:** Objectives don't carry over indefinitely. If something wasn't important enough to complete, re-evaluate whether it belongs in your life.

## Contributing

Contributions are welcome! If you'd like to improve the app or adapt it for your own use cases, feel free to fork the repository.

### Guidelines

1.  **Fork and Clone:** Fork the repo and clone it locally.
2.  **Branching:** Create a new branch for your feature or fix (`git checkout -b feature/amazing-feature`).
3.  **Linting:** Ensure your code passes linting checks (`pnpm run check` and `pnpm run lint`).
4.  **Pull Request:** Submit a Pull Request with a clear description of your changes.

---

*Built with SvelteKit, Svelte 5, Tailwind CSS, Skeleton UI, and Drizzle ORM.*
