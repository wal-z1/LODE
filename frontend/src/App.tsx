import { useState } from "react";
import { HeroSection } from "@/components/site/HeroSection";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { URLinput } from "@/components/site/URLinput";

function App() {
	const [isLight, setIsLight] = useState(false);

	function toggleTheme() {
		setIsLight((current) => !current);
	}

	return (
		<div
			className={`${isLight ? "light" : ""} min-h-screen bg-background text-foreground transition-colors duration-200`}>
			<SiteHeader isLight={isLight} onToggleTheme={toggleTheme} />

			<main
				id="top"
				className="mx-auto w-[calc(100%-48px)] max-w-[1120px] pt-[104px] max-sm:w-[calc(100%-32px)] max-sm:pt-[72px]">
				<HeroSection />
			</main>
			<URLinput  />
			<SiteFooter/>
		</div>
	);
}

export default App;
