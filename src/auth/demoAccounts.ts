export type UserRole = 'admin' | 'pegawai' | 'pelanggan';

type DemoAccount = {
	email: string;
	username: string;
	password: string;
	role: UserRole;
};

const demoAccounts: DemoAccount[] = [
	{ email: 'admin@gmail.com', username: 'admin', password: 'admin123', role: 'admin' },
	{ email: 'pegawai@gmail.com', username: 'pegawai', password: 'pegawai123', role: 'pegawai' },
	{ email: 'pelanggan@gmail.com', username: 'pelanggan', password: 'pelanggan123', role: 'pelanggan' },
];

export function authenticate(identifier: string, password: string): DemoAccount | null {
	const normalizedIdentifier = identifier.trim().toLowerCase();
	if (!normalizedIdentifier || !password) return null;

	return demoAccounts.find(
		(account) =>
			(account.email === normalizedIdentifier || account.username === normalizedIdentifier) &&
			account.password === password,
	) ?? null;
}
