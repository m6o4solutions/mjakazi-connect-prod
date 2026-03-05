import { ReactNode } from "react";

// load foundational styles for the web application
import "@/styles/globals.css";

const SaaSLayout = ({ children }: { children: ReactNode }) => {
	return <>{children}</>;
};

export { SaaSLayout as default };
