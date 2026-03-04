import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// define which paths require authenticated access
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
	// enforce authentication for private application areas
	if (isProtectedRoute(req)) {
		await auth.protect();
	}
});

export const config = {
	matcher: [
		// exclude internal next.js paths and common static assets from middleware execution
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// ensure middleware always processes backend communication channels
		"/(api|trpc)(.*)",
	],
};
