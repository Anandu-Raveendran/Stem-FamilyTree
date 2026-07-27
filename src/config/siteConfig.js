// Site-wide runtime config read from Vite env vars.
const rawAllowPublicEdit = import.meta.env.VITE_ALLOW_PUBLIC_EDIT ?? '';

export const allowPublicEdit = rawAllowPublicEdit.toString().toLowerCase() === 'true';

export default { allowPublicEdit };
