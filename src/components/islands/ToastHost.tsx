import { Toaster } from "sonner";

/** Global Sonner host — the toast everyone ships in 2026. */
export default function ToastHost() {
	return (
		<Toaster
			theme="dark"
			position="bottom-center"
			toastOptions={{
				classNames: {
					toast:
						"!rounded-2xl !border !border-white/10 !bg-surface !text-text !shadow-[0_18px_50px_rgba(0,0,0,0.45)]",
					description: "!text-subtext",
				},
			}}
		/>
	);
}
