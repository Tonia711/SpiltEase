import "@testing-library/jest-dom";

globalThis.importMeta = {
  env: {
    VITE_API_BASE_URL: "http://localhost:3000",
    VITE_AVATAR_BASE_URL: "http://localhost:3000/avatars",
  },
};
