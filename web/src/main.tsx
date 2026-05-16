import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LibraryPage } from "./components/LibraryPage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LibraryPage />
  </StrictMode>
);
