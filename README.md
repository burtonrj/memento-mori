# Memento Mori

A weekly scheduling and objective management application designed to help balance multiple work streams.

## Overview

I created this app to manage my specific work patterns, which involve balancing part-time contracting work with building a startup, **Game Oracle**. It helps in visualizing time allocation and ensuring that objectives for both roles are met without burnout or confusion.

To keep things balanced (and slightly dramatic), the app features a **Memento Mori** clock—a friendly ticking reminder of the time you have left. But don't panic! We counter that existential spice with a **Positive Affirmations** marquee. You can even edit these affirmations right in the app, so whether you need a gentle "You got this!" or a stern "Stop procrastinating!", it's all up to you.

The core philosophy is to have a "fresh slate" each week, allowing for focused planning without the baggage of carrying over endless to-do lists.

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
    *   Run the schema migration (using Drizzle Kit) to set up your tables.

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

## Limitations

*   **Simple Authorization:** The authentication system is basic and designed for a single user (me). It assumes benign data storage. If you plan to store sensitive user data or open this up to multiple users, **proceed with caution**. It is highly recommended to extend this with a robust auth provider like Firebase Auth, Supabase Auth, or Auth.js.
*   **Ephemeral Objectives:** Data storage for objectives is intentionally simple. The app is designed so that objectives persist for the current week. This enforces the "fresh slate" philosophy—if it wasn't important enough to finish this week, re-evaluate it for the next one rather than letting it stale in a backlog.

## Contributing

Contributions are welcome! If you'd like to improve the app or adapt it for your own use cases, feel free to fork the repository.

### Guidelines

1.  **Fork and Clone:** Fork the repo and clone it locally.
2.  **Branching:** Create a new branch for your feature or fix (`git checkout -b feature/amazing-feature`).
3.  **Linting:** Ensure your code passes linting checks (`npm run check` and `npm run lint`).
4.  **Pull Request:** Submit a Pull Request with a clear description of your changes.

---

*Built with SvelteKit, Tailwind CSS, Skeleton UI, and Drizzle ORM.*
