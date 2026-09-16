import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export { CardContent } from "@/components/ui/card-content";

function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("card", className)} {...props} />;
}

export { Card };
