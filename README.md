# Kao Mai (ก้าวใหม่)

## Overview
Kao Mai is a social impact project aimed at connecting homeless individuals with employment opportunities through collaboration with NGOs and local businesses. The application serves as a platform for homeless shelters and employers to manage profiles, job postings, and matches efficiently.

## Features
- **Authentication**: Secure login and registration for shelter staff and employers.
- **Shelter Dashboard**: Manage profiles of homeless individuals, monitor job matches, and coordinate assignments.
- **Employer Dashboard**: Create job postings, view matched candidates, and finalize hiring.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide React (Icons)
- **Backend**: Supabase (Auth & Database)
- **Deployment**: Netlify

## Project Structure
```
kao-mai
├── src
│   ├── main.tsx
│   ├── App.tsx
│   ├── components
│   │   ├── layout
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── ui
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Badge.tsx
│   │   └── common
│   │       ├── LoadingState.tsx
│   │       └── EmptyState.tsx
│   ├── pages
│   │   ├── auth
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── shelter
│   │   │   ├── ShelterDashboard.tsx
│   │   │   ├── Residents.tsx
│   │   │   └── Matching.tsx
│   │   └── employer
│   │       ├── EmployerDashboard.tsx
│   │       ├── CreateJob.tsx
│   │       └── Matches.tsx
│   ├── data
│   │   └── mockData.ts
│   ├── lib
│   │   ├── supabase.ts
│   │   └── matching.ts
│   ├── hooks
│   │   ├── useAuth.ts
│   │   └── useRealtimeJobs.ts
│   ├── types
│   │   └── index.ts
│   ├── styles
│   │   └── index.css
│   └── utils
│       └── format.ts
├── supabase
│   └── migrations
│       └── 001_initial_schema.sql
├── public
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/kao-mai.git
   cd kao-mai
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up Supabase:
   - Create a Supabase project and configure the database.
   - Update the `src/lib/supabase.ts` file with your Supabase URL and API key.

4. Run the application:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## Usage Guidelines
- Shelter staff can register and manage resident profiles, monitor job matches, and coordinate assignments.
- Employers can register, post job openings, and view matched candidates for their job postings.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.