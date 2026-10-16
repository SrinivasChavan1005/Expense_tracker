import { createContext } from "react";

// The context object lives in its own file so AuthContext.jsx exports only a
// component (keeps React Fast Refresh working during development).
export const AuthContext = createContext(null);
