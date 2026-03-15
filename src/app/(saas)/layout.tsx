import { ReactNode } from "react";

// load foundational styles for the web application
import "@/styles/globals.css";

const SaaSLayout = ({ children }: { children: ReactNode }) => {
	return <div className="flex min-h-screen items-center justify-center">{children}</div>;
};

export { SaaSLayout as default };
