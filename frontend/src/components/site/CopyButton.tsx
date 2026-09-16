import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

function CopyButton({ value, label }: { value: string; label: string }) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			const textarea = document.createElement("textarea");

			textarea.value = value;
			textarea.setAttribute("readonly", "");
			textarea.style.position = "fixed";
			textarea.style.opacity = "0";

			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			textarea.remove();
		}

		setCopied(true);

		window.setTimeout(() => {
			setCopied(false);
		}, 1500);
	}

	return (
		<Button
			type="button"
			variant="outline"
			size="xs"
			aria-label={copied ? `${label} copied` : `Copy ${label}`}
			onClick={handleCopy}
			className="shrink-0">
			{copied ? <Check className="size-3" /> : <Copy className="size-3" />}
			{copied ? "Copied" : "Copy"}
		</Button>
	);
}

export { CopyButton };
