# README.md

# Chat Client Application

This is a chat client application built with TypeScript and React. It provides real-time messaging features, allowing users to send and receive messages, upload files, and manage chat rooms.

## Features

- Real-time messaging using WebSocket
- User authentication
- File upload functionality
- Responsive layout with a sidebar for chat rooms
- Message formatting utilities

## Project Structure

```
chat-client
├── src
│   ├── components
│   │   ├── Chat
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── FileUpload.tsx
│   │   └── Layout
│   │       ├── Header.tsx
│   │       └── Sidebar.tsx
│   ├── services
│   │   ├── api.ts
│   │   ├── socket.ts
│   │   └── auth.ts
│   ├── hooks
│   │   └── useChat.ts
│   ├── types
│   │   └── index.ts
│   ├── utils
│   │   └── formatters.ts
│   ├── App.tsx
│   └── index.tsx
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd chat-client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

## Usage

- Open the application in your browser.
- Log in with your credentials.
- Start chatting with your contacts or in chat rooms.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.

## License

This project is licensed under the MIT License.