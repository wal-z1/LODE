import { useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

function App() {
	const [isLight, setIsLight] = useState(false);

	function toggleTheme() {
		setIsLight((current) => !current);
	}

	return (
		<div className={isLight ? "app-shell light" : "app-shell"}>
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
					onClick={toggleTheme}
					aria-label={isLight ? "Use dark mode" : "Use light mode"}>
					{isLight ? <Moon weight="bold" /> : <Sun weight="bold" />}
				</Button>
			</header>

			<main id="top" className="page-content">
				<section id="overview" className="intro-section">
					<h1>
						Keep your edge.
						<br />
						<span>Know your surface.</span>
					</h1>
					<div className="intro-actions"></div>
				</section>

				<section id="systems" className="system-section"></section>

				<section id="signals" className="manual-space"></section>
			</main>

			<footer className="site-footer">
				<span>STATUS: NOMINAL</span>
			</footer>
		</div>
	);
}

export default App;
