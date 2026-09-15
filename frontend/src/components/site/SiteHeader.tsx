import { Moon, Sun } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

type SiteHeaderProps = {
	isLight: boolean;
	onToggleTheme: () => void;
};

const NAV_LINKS = [
	{ href: "#overview", label: "Overview", active: true },
	{ href: "https://github.com/wal-z1/LODE", label: "GitHub" },
];

function SiteHeader({ isLight, onToggleTheme }: SiteHeaderProps) {
	return (
		<header className="mx-auto flex h-22 w-[calc(100%-48px)] max-w-280 items-center justify-between border-b border-border max-sm:h-18 max-sm:w-[calc(100%-32px)]">
			<div className="inline-flex items-center gap-3 select-none">
				<img
					src="/logo.png"
					alt=""
					className="size-9 rounded-md object-cover ring-1 ring-border"
				/>
				<span className="text-base font-semibold tracking-tight text-foreground select-text">
					LODE
				</span>
			</div>

			<nav
				aria-label="Main navigation"
				className="ml-auto mr-7.5 flex gap-7 max-sm:hidden">
				{NAV_LINKS.map(({ href, label, active }) => (
					<a
						key={href}
						href={href}
						className={`text-[11px] no-underline transition-colors duration-150 ${
							active
								? "relative text-foreground after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-px after:bg-primary after:content-['']"
								: "text-muted-foreground hover:text-foreground"
						}`}>
						{label}
					</a>
				))}
			</nav>
			<Button
				variant="outline"
				size="icon"
				onClick={onToggleTheme}
				aria-label={isLight ? "Use dark mode" : "Use light mode"}
				className="border-border text-foreground">
				{isLight ? <Moon weight="bold" /> : <Sun weight="bold" />}
			</Button>
		</header>
	);
}

export { SiteHeader };
