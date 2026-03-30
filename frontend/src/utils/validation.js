// validation utils placeholder
export const required = (val) => (val == null || val === '' ? 'Required' : undefined);
export const minLength = (n) => (val) => (val && val.length < n ? `Min ${n} characters` : undefined);

