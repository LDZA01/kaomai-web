# Kao Mai (ก้าวใหม่)

## Overview
Kao Mai is a social impact project aimed at connecting homeless individuals with employment opportunities through collaboration with NGOs and local businesses. The application serves as a platform for homeless shelters and employers to manage profiles, job postings, and matches efficiently.

## Features
- **Authentication**: Secure login and registration for shelter staff and employers.
- **Shelter Dashboard**: Manage profiles of homeless individuals, monitor job matches, and coordinate assignments.
- **Employer Dashboard**: Create job postings, view matched candidates, and finalize hiring.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Lucide React (Icons)
- **Backend**: Supabase (Auth & Database)
- **Deployment**: Netlify

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/LDZA01/kaowmai-web.git
   cd kaowmai-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a Supabase project and configure the database.
   - Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env`.

4. Run the application:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## License
This project is licensed under the MIT License.