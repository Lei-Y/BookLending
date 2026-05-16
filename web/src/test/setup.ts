import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// React Testing Library mounts into the document; clean up after each test
// so the previous test's nodes do not leak into the next one.
afterEach(() => {
  cleanup();
});
