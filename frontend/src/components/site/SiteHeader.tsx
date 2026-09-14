import { Moon, Sun } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

type SiteHeaderProps = {
	isLight: boolean;
	onToggleTheme: () => void;
};

function SiteHeader({ isLight, onToggleTheme }: SiteHeaderProps) {
	return (
		<header className="site-header">
			<a className="brand" href="#top" aria-label="LODE home">
				<img src="/logo.png" alt="" />
				<span>LODE</span>
			</a>
			<nav className="main-nav" aria-label="Main navigation">
				<a className="active" href="#overview">
					Overview
				</a>
				<a href="#placeholder-1">Placeholder 1</a>
				<a href="#placeholder-2">Placeholder 2</a>
			</nav>
			<Button
				className="theme-button"
				variant="outline"
				size="icon"
				onClick={onToggleTheme}
				aria-label={isLight ? "Use dark mode" : "Use light mode"}>
				{isLight ? <Moon weight="bold" /> : <Sun weight="bold" />}
			</Button>
		</header>
	);
}

export { SiteHeader };
