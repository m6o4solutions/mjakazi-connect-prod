import { Container } from "@/components/container";
import { cn } from "@/lib/utils";
import type { WajakaziArchive } from "@/payload-types";

const bgMap: Record<string, string> = { subtle: "bg-bg-subtle", white: "bg-bg-white" };

const WajakaziArchiveBlock = async ({
	backgroundVariant = "subtle",
}: WajakaziArchive) => {
	const backgroundClass = bgMap[backgroundVariant] ?? "bg-bg-subtle";

	return (
		<div className={cn("px-4 py-20", backgroundClass)}>
			<Container className="">Wajakazi Archive Block</Container>
		</div>
	);
};

export { WajakaziArchiveBlock };
