import { create } from "zustand";

/** Zustand pulse store — tiny global vibe for the last hey that bloomed. */
type PulseState = {
	lastBody: string | null;
	pulseCount: number;
	recordPulse: (body: string) => void;
};

export const usePulseStore = create<PulseState>((set) => ({
	lastBody: null,
	pulseCount: 0,
	recordPulse: (body) =>
		set((state) => ({
			lastBody: body,
			pulseCount: state.pulseCount + 1,
		})),
}));
