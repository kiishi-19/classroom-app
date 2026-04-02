# Virtual Classroom

A real-time virtual classroom application with video conferencing, AI-powered transcription, and role-based access control. Built with React, Cloudflare Workers, and Cloudflare RealtimeKit.

## Features

- **Role-based Access Control**: Three user roles - Teacher, TA (Teaching Assistant), and Student
- **Video Conferencing**: High-quality video/audio powered by Cloudflare RealtimeKit
- **Live AI Transcription**: Real-time captions with keyword detection for educational content
- **Virtual Backgrounds**: Blur and background replacement options for privacy
- **Persistent Meeting State**: Durable Objects maintain active classroom sessions
- **Responsive Design**: Modern dark-themed UI built with Tailwind CSS

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite (build tool & dev server)
- Tailwind CSS 4
- Cloudflare RealtimeKit React SDK
- ESLint

### Backend
- Cloudflare Workers
- Durable Objects (for stateful classroom coordination)
- Cloudflare RealtimeKit API
- TypeScript

## Prerequisites

Before you begin, ensure you have:

- [Node.js](https://nodejs.org/) 18 or higher
- A [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed globally: `npm install -g wrangler`
- A Cloudflare RealtimeKit app created in your Cloudflare dashboard

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/kiishi-19/classroom-app.git
cd classroom-app
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install worker dependencies
cd ../worker
npm install
```

### 3. Configure Environment Variables

#### Worker Setup

1. Navigate to the worker directory:
```bash
cd worker
```

2. Create a `.dev.vars` file for local development (this file is gitignored):
```bash
touch .dev.vars
```

3. Add your Cloudflare credentials to `.dev.vars`:
```
CLOUDFLARE_API_TOKEN=your_actual_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_actual_account_id_here
CLOUDFLARE_REALTIMEKIT_APP_ID=your_actual_app_id_here
```

4. Edit `wrangler.jsonc` and replace the placeholder values:
```json
"vars": {
  "CLOUDFLARE_ACCOUNT_ID": "YOUR_ACCOUNT_ID_HERE",
  "CLOUDFLARE_REALTIMEKIT_APP_ID": "YOUR_APP_ID_HERE"
}
```

Replace `YOUR_ACCOUNT_ID_HERE` and `YOUR_APP_ID_HERE` with your actual Cloudflare Account ID and RealtimeKit App ID.

5. Set your API token as a secret (for production deployment):
```bash
wrangler secret put CLOUDFLARE_API_TOKEN
```

**Getting your credentials:**
- **Account ID**: Found on the right sidebar of your Cloudflare dashboard
- **RealtimeKit App ID**: Create a RealtimeKit app at https://dash.cloudflare.com → RealtimeKit → Create Application
- **API Token**: Generate at https://dash.cloudflare.com/profile/api-tokens with the following permissions:
  - Account: RealtimeKit: Edit
  - Account: Account Settings: Read

#### Frontend Setup

No additional configuration needed for local development. The frontend will connect to your local worker.

### 4. Run Locally

You need to run both the worker and frontend simultaneously:

**Terminal 1 - Start the Worker:**
```bash
cd worker
npm run dev
```
The worker will start on `http://localhost:8787`

**Terminal 2 - Start the Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:5173`

### 5. Test the Application

1. Open `http://localhost:5173` in your browser
2. Enter a classroom ID (try `math-101` which is pre-configured)
3. Select your role (Teacher, TA, or Student)
4. Enter your display name
5. Click "Join Classroom"
6. Open another browser/incognito window and join as a different user to test multi-user functionality

## Project Structure

```
classroom-app/
├── frontend/                 # React web application
│   ├── src/
│   │   ├── App.tsx          # Main app component
│   │   ├── MeetingRoom.tsx  # Video meeting component
│   │   └── ...
│   ├── package.json
│   ├── vite.config.ts
│   └── wrangler.jsonc       # Cloudflare Pages config
│
└── worker/                   # Cloudflare Workers backend
    ├── src/
    │   └── index.ts         # Worker & Durable Object code
    ├── package.json
    └── wrangler.jsonc       # Worker configuration
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/classroom/join` | POST | Join a classroom (creates/gets meeting) |
| `/api/classroom/debug/:classId` | GET | Debug classroom meeting state |

## Deployment

### Deploy the Worker

```bash
cd worker
wrangler deploy
```

### Deploy the Frontend (Cloudflare Pages)

```bash
cd frontend
npm run build
wrangler pages deploy dist
```

## Available Classrooms

By default, one classroom is pre-configured in `worker/src/index.ts`:

- **math-101**: Math 101 (Teacher: Mrs. Johnson)

You can add more classrooms by editing the `CLASSROOMS` record in `worker/src/index.ts`.

## Development

### Adding a New Classroom

Edit `worker/src/index.ts` and add to the `CLASSROOMS` object:

```typescript
const CLASSROOMS: Record<string, ClassroomRecord> = {
  "math-101": {
    classId: "math-101",
    title: "Math 101",
    teacherName: "Mrs. Johnson",
  },
  "your-new-class": {
    classId: "your-new-class",
    title: "Your Class Title",
    teacherName: "Teacher Name",
  },
};
```

### Modifying AI Transcription Keywords

The transcription feature detects keywords. Edit the keywords in `worker/src/index.ts` in the `createMeeting` function:

```typescript
keywords: ["algebra", "calculus", "homework", "quiz", "assignment"],
```

### Running Tests

```bash
cd worker
npm test
```

## Troubleshooting

### Common Issues

**Worker not connecting to RealtimeKit:**
- Verify your API token has the correct permissions
- Check that your Account ID and App ID are correct in `wrangler.jsonc` and `.dev.vars`
- Ensure your RealtimeKit app is active in the Cloudflare dashboard

**Frontend can't connect to worker:**
- Make sure both the worker and frontend are running
- Check that CORS is properly configured (it is by default)
- Verify the worker URL in your browser's network tab

**Video/audio not working:**
- Ensure you've granted camera and microphone permissions in your browser
- Check that you're using HTTPS (required for media APIs) or localhost

## Security Considerations

- Never commit `.dev.vars` or any file containing API tokens
- The `.gitignore` is already configured to exclude sensitive files
- Rotate your API tokens regularly
- Use environment-specific secrets for production deployments

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with Cloudflare Workers and RealtimeKit
