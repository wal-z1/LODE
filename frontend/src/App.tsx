import { useState } from "react";
import { HeroSection } from "@/components/site/HeroSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

function App() {
	const [isLight, setIsLight] = useState(false);

	function toggleTheme() {
		setIsLight((current) => !current);
	}

	return (
		<div className={isLight ? "app-shell light" : "app-shell"}>
			<SiteHeader isLight={isLight} onToggleTheme={toggleTheme} />

			<main id="top" className="page-content">
				<HeroSection />
			</main>

			<SiteFooter />
		</div>
	);
}

export default App;
