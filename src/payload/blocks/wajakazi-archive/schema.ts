import type { Block } from "payload";

const WajakaziArchive: Block = {
	slug: "wajakaziArchive",
	interfaceName: "WajakaziArchive",
	labels: { singular: "Wajakazi Archive Block", plural: "Wajakazi Archive Blocks" },
	fields: [
		{
			name: "backgroundVariant",
			type: "select",
			label: "Background Style",
			defaultValue: "subtle",
			options: [
				{ label: "Subtle", value: "subtle" },
				{ label: "White", value: "white" },
			],
			required: true,
		},
	],
};

export { WajakaziArchive };
