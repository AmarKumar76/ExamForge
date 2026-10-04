# ExamForge Frontend Client Architecture

This directory will contain the React Web Client for ExamForge.

## Directory Structure
- `src/components/`: Reusable visual UI components (buttons, inputs, cards, modals)
- `src/layouts/`: Base layouts (Sidebar navigation, Header, Auth split layout)
- `src/pages/`: Page-level container components mapped to routes
- `src/features/`: Feature-sliced business modules (Auth, QuestionStudio, ExamRunner, Proctoring, Analytics)
- `src/hooks/`: Custom React hooks (useAuth, useExamTimer, useSocket, useTheme)
- `src/services/`: API client service layer (Axios / Fetch instances)
- `src/store/`: Global state management (Context API / Redux Toolkit / Zustand)
- `src/utils/`: Formatting, math, and helper utilities
- `src/constants/`: Configuration constants, route paths, and role definitions
- `src/routes/`: React Router definitions and role-based route guards

*Note: UI implementation will take place during the Frontend Implementation phase.*
