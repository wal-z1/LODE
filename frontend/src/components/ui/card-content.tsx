import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("card-content", className)} {...props} />;
}

export { CardContent };
