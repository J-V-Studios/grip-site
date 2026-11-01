// Supabase Auth helpers for grip hunter accounts + profiles.
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { clean } from "@/lib/text";

export type GripProfile = {
	id: string;
	username: string | null;
	display_name: string | null;
};

export function normalizeUsername(raw: string): string {
	return clean(raw, 24)
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, "");
}

export function validateUsername(raw: string): string | null {
	const name = normalizeUsername(raw);
	if (name.length < 3 || name.length > 24) {
		return "username must be 3–24 letters, numbers, or _";
	}
	if (!/^[a-z0-9_]+$/.test(name)) {
		return "username must be 3–24 letters, numbers, or _";
	}
	return null;
}

export function validatePassword(password: string): string | null {
	if (password.length < 6) return "password must be at least 6 characters";
	if (password.length > 72) return "password is too long";
	return null;
}

export async function getSession(): Promise<Session | null> {
	const { data, error } = await getSupabase().auth.getSession();
	if (error) return null;
	return data.session;
}

export async function getUser(): Promise<User | null> {
	const session = await getSession();
	return session?.user ?? null;
}

export async function fetchMyProfile(): Promise<GripProfile | null> {
	const user = await getUser();
	if (!user) return null;
	const { data, error } = await getSupabase()
		.from("profiles")
		.select("id,username,display_name")
		.eq("id", user.id)
		.maybeSingle();
	if (error || !data) return null;
	return data as GripProfile;
}

export async function signUpHunter(input: {
	email: string;
	password: string;
	username: string;
}): Promise<{ error: string | null; needsEmailConfirm?: boolean }> {
	const email = clean(input.email, 120).toLowerCase();
	const usernameError = validateUsername(input.username);
	if (usernameError) return { error: usernameError };
	const passwordError = validatePassword(input.password);
	if (passwordError) return { error: passwordError };
	if (!email.includes("@")) return { error: "enter a valid email" };

	const username = normalizeUsername(input.username);
	const supabase = getSupabase();

	const { data, error } = await supabase.auth.signUp({
		email,
		password: input.password,
		options: {
			data: { username, display_name: username },
		},
	});

	if (error) return { error: error.message };

	if (data.session?.user) {
		const claimed = await claimUsername(username);
		if (claimed.error) return { error: claimed.error };
		return { error: null };
	}

	// Email confirmation required — remember username to claim after first login.
	try {
		localStorage.setItem("lilgrip-pending-username", username);
	} catch {
		/* ignore */
	}
	return { error: null, needsEmailConfirm: true };
}

export async function signInHunter(input: {
	email: string;
	password: string;
}): Promise<{ error: string | null }> {
	const email = clean(input.email, 120).toLowerCase();
	if (!email.includes("@")) return { error: "enter a valid email" };
	const passwordError = validatePassword(input.password);
	if (passwordError) return { error: passwordError };

	const { error } = await getSupabase().auth.signInWithPassword({
		email,
		password: input.password,
	});
	if (error) return { error: error.message };

	try {
		const pending = localStorage.getItem("lilgrip-pending-username");
		if (pending) {
			const claimed = await claimUsername(pending);
			if (!claimed.error) {
				localStorage.removeItem("lilgrip-pending-username");
			}
		}
	} catch {
		/* ignore */
	}

	return { error: null };
}

export async function signOutHunter(): Promise<void> {
	await getSupabase().auth.signOut();
}

export async function claimUsername(
	raw: string,
): Promise<{ username: string | null; error: string | null }> {
	const usernameError = validateUsername(raw);
	if (usernameError) return { username: null, error: usernameError };
	const username = normalizeUsername(raw);

	const { data, error } = await getSupabase().rpc("claim_grip_username", {
		p_username: username,
	});

	if (error) return { username: null, error: error.message };

	const payload = (data ?? {}) as {
		ok?: boolean;
		username?: string;
		error?: string;
	};
	if (payload.ok === false) {
		return {
			username: null,
			error: payload.error ?? "could not claim username",
		};
	}
	return { username: payload.username ?? username, error: null };
}

export function hunterLabel(profile: GripProfile | null): string {
	if (!profile) return "anon";
	return (
		clean(profile.username || "", 24) ||
		clean(profile.display_name || "", 24) ||
		"anon"
	);
}

export function onAuthChange(
	cb: (session: Session | null) => void,
): () => void {
	const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
		cb(session);
	});
	return () => data.subscription.unsubscribe();
}
