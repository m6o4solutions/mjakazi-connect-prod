export async function retry<T>(
	fn: () => Promise<T>,
	retries = 6,
	delay = 300,
): Promise<T | null> {
	for (let i = 0; i < retries; i++) {
		const result = await fn();

		if (result) {
			return result;
		}

		await new Promise((resolve) => setTimeout(resolve, delay));
	}

	return null;
}
