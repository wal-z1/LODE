import { Input } from "@/components/ui/input";

function URLinput() {
	return (
		<Input
			type="text"
			placeholder="Enter URL"
			className="p-2 w-full max-w-[400px] border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
			flex items-center justify-center mx-auto mt-4 max-sm:mt-2"
		/>
	);
}

export { URLinput };
