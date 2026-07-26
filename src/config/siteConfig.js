// Site-wide runtime config read from Vite env vars.
export const allowPublicEdit = Boolean(
  (import.meta.env.VITE_ALLOW_PUBLIC_EDIT || '').toString().toLowerCase() === 'true'
);

export default { allowPublicEdit };
