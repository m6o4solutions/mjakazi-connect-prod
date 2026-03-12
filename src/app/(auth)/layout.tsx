import { ReactNode } from "react";

// load foundational styles for the web application
import "@/styles/globals.css";

const AuthLayout = ({ children }: { children: ReactNode }) => {
	return <div className="flex min-h-screen items-center justify-center">{children}</div>;
};

export { AuthLayout as default };
