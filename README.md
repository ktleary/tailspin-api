# Tailspin API

## Overview

Tailspin is a web application that generates short stories from user input. This repository contains the API for the Tailspin application.

## API Documentation

- create-story
  - POST
  - /api/v1/create-story
  - Creates a new story
  - Request Body: Story
    - Response Body: Story

## Models

### Character

```typescript
interface Character {
  givenName: string;
  familyName: string;
  age: number;
  attributes: string[];
  occupation: string;
}
```

### Story

```typescript
interface Story {
  theme: string;
  characters: Character[];
  location: string;
  time: string;
  plotPoint: string;
  conflict: string;
  ending: string;
  tone: string;
}
```

## Dependencies

- Express
- OpenAI
- Cors

## Getting Started

To get started with Tailspin, clone this repository and install its dependencies:

```bash
git clone
cd tailspin-api
npm install
```

To run Tailspin locally:

```bash
npm start
```

This will start the application on localhost:3001 (or your default Express port).

## Building for Production

To build the application for production:

```bash
npm run build
```

This will create a build folder with a production build of the application.

## Contributing

Contributions to Tailspin are welcome! Whether it's submitting a bug, proposing new features, or improving documentation, your input is highly appreciated.

- Fork the repository.
- Create a new branch with a descriptive name.
- Make your changes.
- Submit a pull request.

## License

Tailspin is open-source software licensed under the GPL-3.0-or-later license.
